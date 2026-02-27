import { GET, POST } from "./route";

const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

// Helper to build a chainable Supabase query mock
function makeChain(finalResult: unknown) {
  const chain: Record<string, unknown> = {};
  const methods = ["select", "insert", "update", "delete", "eq", "order", "single"];
  methods.forEach((m) => {
    chain[m] = vi.fn().mockReturnValue(chain);
  });
  // The last call in each chain returns a promise
  (chain.order as ReturnType<typeof vi.fn>).mockResolvedValue(finalResult);
  (chain.single as ReturnType<typeof vi.fn>).mockResolvedValue(finalResult);
  return chain;
}

describe("GET /api/courses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    const res = await GET();
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 403 when user is not a teacher", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-1" } }, error: null });

    // First from() call: get user profile → returns student role
    const profileChain = makeChain({ data: { role: "student" }, error: null });
    mockFrom.mockReturnValueOnce(profileChain);

    const res = await GET();
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe("Forbidden");
  });

  it("returns 200 with courses for authenticated teacher", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: "teacher-1" } }, error: null });

    const courses = [{ id: "c1", title: "Psych 101" }];
    const profileChain = makeChain({ data: { role: "teacher" }, error: null });
    const coursesChain = makeChain({ data: courses, error: null });

    mockFrom
      .mockReturnValueOnce(profileChain)
      .mockReturnValueOnce(coursesChain);

    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.courses).toEqual(courses);
  });
});

describe("POST /api/courses", () => {
  function makeRequest(body: unknown) {
    return new Request("http://localhost/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when title is missing", async () => {
    const res = await POST(makeRequest({ courseCode: "PSY101", semester: "Fall 2026" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/required/i);
  });

  it("returns 400 when courseCode is missing", async () => {
    const res = await POST(makeRequest({ title: "Psych", semester: "Fall 2026" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/required/i);
  });

  it("returns 400 when semester is missing", async () => {
    const res = await POST(makeRequest({ title: "Psych", courseCode: "PSY101" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/required/i);
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    const res = await POST(makeRequest({ title: "Psych", courseCode: "PSY101", semester: "Fall 2026" }));
    expect(res.status).toBe(401);
  });

  it("returns 403 when user is not a teacher", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-1" } }, error: null });

    const profileChain = makeChain({ data: { role: "student" }, error: null });
    mockFrom.mockReturnValueOnce(profileChain);

    const res = await POST(makeRequest({ title: "Psych", courseCode: "PSY101", semester: "Fall 2026" }));
    expect(res.status).toBe(403);
  });

  it("returns 500 when database insert fails", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: "teacher-1" } }, error: null });

    const profileChain = makeChain({ data: { role: "teacher" }, error: null });
    const insertChain: Record<string, unknown> = {};
    insertChain.insert = vi.fn().mockReturnValue(insertChain);
    insertChain.select = vi.fn().mockReturnValue(insertChain);
    insertChain.single = vi.fn().mockResolvedValue({ data: null, error: { message: "DB error" } });

    mockFrom
      .mockReturnValueOnce(profileChain)
      .mockReturnValueOnce(insertChain);

    const res = await POST(makeRequest({ title: "Psych 101", courseCode: "PSY101", semester: "Fall 2026" }));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toMatch(/failed to create course/i);
  });

  it("returns 201 with new course on successful creation", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: "teacher-1" } }, error: null });

    const newCourse = { id: "c1", title: "Psych 101", course_code: "PSY101", semester: "Fall 2026" };
    const profileChain = makeChain({ data: { role: "teacher" }, error: null });

    // courses insert chain: select().single()
    const insertChain: Record<string, unknown> = {};
    insertChain.insert = vi.fn().mockReturnValue(insertChain);
    insertChain.select = vi.fn().mockReturnValue(insertChain);
    insertChain.single = vi.fn().mockResolvedValue({ data: newCourse, error: null });

    mockFrom
      .mockReturnValueOnce(profileChain)
      .mockReturnValueOnce(insertChain);

    const res = await POST(makeRequest({ title: "Psych 101", courseCode: "PSY101", semester: "Fall 2026" }));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.course).toEqual(newCourse);
  });
});
