import { GET, POST } from "./route";

const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

// Build a chainable mock; the terminal method resolves with `finalResult`
function makeChain(finalResult: unknown, terminalMethod = "single") {
  const chain: Record<string, unknown> = {};
  const methods = ["select", "insert", "eq", "order", "single"];
  methods.forEach((m) => {
    chain[m] = vi.fn().mockReturnValue(chain);
  });
  (chain[terminalMethod] as ReturnType<typeof vi.fn>).mockResolvedValue(finalResult);
  return chain;
}

describe("GET /api/enrollments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 403 when user is not a student", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: "t1" } }, error: null });
    const profileChain = makeChain({ data: { role: "teacher" }, error: null });
    mockFrom.mockReturnValueOnce(profileChain);

    const res = await GET();
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe("Forbidden");
  });

  it("returns 200 with enrollments for a student", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: "s1" } }, error: null });

    const enrollments = [{ id: "e1", enrolled_at: "2026-01-01", course: { title: "Psych 101" } }];

    const profileChain = makeChain({ data: { role: "student" }, error: null });
    const enrollmentsChain = makeChain({ data: enrollments, error: null }, "order");

    mockFrom
      .mockReturnValueOnce(profileChain)
      .mockReturnValueOnce(enrollmentsChain);

    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.enrollments).toEqual(enrollments);
  });
});

describe("POST /api/enrollments", () => {
  function makeRequest(body: unknown) {
    return new Request("http://localhost/api/enrollments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const res = await POST(makeRequest({ invitationCode: "ABCDEF" }));
    expect(res.status).toBe(401);
  });

  it("returns 403 when user is not a student", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: "t1" } }, error: null });
    const profileChain = makeChain({ data: { role: "teacher" }, error: null });
    mockFrom.mockReturnValueOnce(profileChain);

    const res = await POST(makeRequest({ invitationCode: "ABCDEF" }));
    expect(res.status).toBe(403);
  });

  it("returns 400 when invitationCode is missing", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: "s1" } }, error: null });
    const profileChain = makeChain({ data: { role: "student" }, error: null });
    mockFrom.mockReturnValueOnce(profileChain);

    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/required/i);
  });

  it("returns 404 when invitation code is invalid", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: "s1" } }, error: null });

    const profileChain = makeChain({ data: { role: "student" }, error: null });
    const courseChain = makeChain({ data: null, error: { message: "No rows found" } });

    mockFrom
      .mockReturnValueOnce(profileChain)
      .mockReturnValueOnce(courseChain);

    const res = await POST(makeRequest({ invitationCode: "BADCOD" }));
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toMatch(/Invalid invitation code/i);
  });

  it("returns 409 when already enrolled", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: "s1" } }, error: null });

    const profileChain = makeChain({ data: { role: "student" }, error: null });
    const courseChain = makeChain({ data: { id: "c1" }, error: null });
    const existingChain = makeChain({ data: { id: "e1" }, error: null });

    mockFrom
      .mockReturnValueOnce(profileChain)
      .mockReturnValueOnce(courseChain)
      .mockReturnValueOnce(existingChain);

    const res = await POST(makeRequest({ invitationCode: "ABCDEF" }));
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toMatch(/already enrolled/i);
  });

  it("returns 201 with enrollment on success", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: "s1" } }, error: null });

    const enrollment = { id: "e1", enrolled_at: "2026-01-01" };
    const course = { id: "c1", title: "Psych 101" };

    const profileChain = makeChain({ data: { role: "student" }, error: null });
    const courseChain = makeChain({ data: course, error: null });
    const existingChain = makeChain({ data: null, error: null }); // not enrolled

    // Insert chain: insert().select().single()
    const insertChain: Record<string, unknown> = {};
    insertChain.insert = vi.fn().mockReturnValue(insertChain);
    insertChain.select = vi.fn().mockReturnValue(insertChain);
    insertChain.single = vi.fn().mockResolvedValue({ data: enrollment, error: null });

    mockFrom
      .mockReturnValueOnce(profileChain)
      .mockReturnValueOnce(courseChain)
      .mockReturnValueOnce(existingChain)
      .mockReturnValueOnce(insertChain);

    const res = await POST(makeRequest({ invitationCode: "ABCDEF" }));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.enrollment).toEqual(enrollment);
    expect(data.course).toEqual(course);
  });
});
