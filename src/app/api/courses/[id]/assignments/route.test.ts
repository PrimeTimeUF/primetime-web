import { GET, POST } from "./route";

const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

const COURSE_ID = "course-123";
const params = Promise.resolve({ id: COURSE_ID });

// Build a chainable Supabase query mock. The terminal method resolves with the given value.
function makeChain(result: unknown, terminal: "single" | "order" | "in" = "single") {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  ["select", "insert", "update", "delete", "eq", "order", "single", "in"].forEach((m) => {
    chain[m] = vi.fn().mockReturnValue(chain);
  });
  chain[terminal].mockResolvedValue(result);
  return chain;
}

// ─── GET ─────────────────────────────────────────────────────────────────────

describe("GET /api/courses/[id]/assignments", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const res = await GET({} as Request, { params });
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ error: "Unauthorized" });
  });

  it("returns 401 on auth error", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("auth failed") });

    const res = await GET({} as Request, { params });
    expect(res.status).toBe(401);
  });

  it("returns 404 when user profile not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    mockFrom.mockReturnValueOnce(makeChain({ data: null, error: null }));

    const res = await GET({} as Request, { params });
    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({ error: "User not found" });
  });

  // Teacher path

  it("returns 403 when teacher does not own course", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "t1" } }, error: null });
    mockFrom
      .mockReturnValueOnce(makeChain({ data: { role: "teacher" }, error: null })) // profile
      .mockReturnValueOnce(makeChain({ data: null, error: null }));               // course ownership

    const res = await GET({} as Request, { params });
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ error: "Forbidden" });
  });

  it("returns 500 when assignments fetch fails (teacher)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "t1" } }, error: null });
    mockFrom
      .mockReturnValueOnce(makeChain({ data: { role: "teacher" }, error: null }))
      .mockReturnValueOnce(makeChain({ data: { id: COURSE_ID }, error: null }))
      .mockReturnValueOnce(makeChain({ data: null, error: new Error("db error") }, "order"));

    const res = await GET({} as Request, { params });
    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ error: "Failed to fetch assignments" });
  });

  it("returns 200 with all assignments for teacher", async () => {
    const assignments = [
      { id: "a1", session_id: "s1", is_published: false },
      { id: "a2", session_id: "s2", is_published: true },
    ];
    mockGetUser.mockResolvedValue({ data: { user: { id: "t1" } }, error: null });
    mockFrom
      .mockReturnValueOnce(makeChain({ data: { role: "teacher" }, error: null }))
      .mockReturnValueOnce(makeChain({ data: { id: COURSE_ID }, error: null }))
      .mockReturnValueOnce(makeChain({ data: assignments, error: null }, "order"));

    const res = await GET({} as Request, { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.assignments).toHaveLength(2);
    // Teacher sees unpublished assignments too
    expect(body.assignments.some((a: { is_published: boolean }) => !a.is_published)).toBe(true);
  });

  // Student path

  it("returns 403 when student is not enrolled", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "s1" } }, error: null });
    mockFrom
      .mockReturnValueOnce(makeChain({ data: { role: "student" }, error: null }))
      .mockReturnValueOnce(makeChain({ data: null, error: null })); // enrollment

    const res = await GET({} as Request, { params });
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ error: "Forbidden" });
  });

  it("returns 500 when assignments fetch fails (student)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "s1" } }, error: null });
    mockFrom
      .mockReturnValueOnce(makeChain({ data: { role: "student" }, error: null }))
      .mockReturnValueOnce(makeChain({ data: { id: "e1" }, error: null })) // enrollment
      .mockReturnValueOnce(makeChain({ data: null, error: new Error("db error") }, "order"));

    const res = await GET({} as Request, { params });
    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ error: "Failed to fetch assignments" });
  });

  it("returns 200 with assignments and progress stats for student", async () => {
    const assignments = [
      { id: "a1", session_id: "s1", is_published: true },
      { id: "a2", session_id: "s2", is_published: true },
    ];
    const results = [
      { session_id: "s1", score: 8, total_questions: 10, completed_at: "2024-01-01" },
    ];
    mockGetUser.mockResolvedValue({ data: { user: { id: "s1" } }, error: null });
    mockFrom
      .mockReturnValueOnce(makeChain({ data: { role: "student" }, error: null }))
      .mockReturnValueOnce(makeChain({ data: { id: "e1" }, error: null })) // enrollment
      .mockReturnValueOnce(makeChain({ data: assignments, error: null }, "order")) // assignments
      .mockReturnValueOnce(makeChain({ data: results, error: null }, "in")); // completions

    const res = await GET({} as Request, { params });
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.assignments).toHaveLength(2);
    expect(body.progress.total_assigned).toBe(2);
    expect(body.progress.completed_count).toBe(1);
    expect(body.progress.completion_percentage).toBe(50);
    expect(body.progress.average_score).toBe(80);
  });

  it("returns 200 with zero progress when student has no completions", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "s1" } }, error: null });
    mockFrom
      .mockReturnValueOnce(makeChain({ data: { role: "student" }, error: null }))
      .mockReturnValueOnce(makeChain({ data: { id: "e1" }, error: null }))
      .mockReturnValueOnce(makeChain({ data: [], error: null }, "order"));
    // No results fetch when sessionIds is empty

    const res = await GET({} as Request, { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.progress.total_assigned).toBe(0);
    expect(body.progress.completion_percentage).toBe(0);
    expect(body.progress.average_score).toBe(0);
  });

  it("returns 403 for unknown role", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    mockFrom.mockReturnValueOnce(makeChain({ data: { role: "admin" }, error: null }));

    const res = await GET({} as Request, { params });
    expect(res.status).toBe(403);
  });
});

// ─── POST ────────────────────────────────────────────────────────────────────

describe("POST /api/courses/[id]/assignments", () => {
  beforeEach(() => vi.clearAllMocks());

  function makePostRequest(body: object) {
    return {
      json: () => Promise.resolve(body),
    } as unknown as Request;
  }

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const res = await POST(makePostRequest({}), { params });
    expect(res.status).toBe(401);
  });

  it("returns 403 when user is not a teacher", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "s1" } }, error: null });
    mockFrom.mockReturnValueOnce(makeChain({ data: { role: "student" }, error: null }));

    const res = await POST(makePostRequest({}), { params });
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ error: "Forbidden" });
  });

  it("returns 403 when profile is null", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "t1" } }, error: null });
    mockFrom.mockReturnValueOnce(makeChain({ data: null, error: null }));

    const res = await POST(makePostRequest({}), { params });
    expect(res.status).toBe(403);
  });

  it("returns 403 when teacher does not own course", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "t1" } }, error: null });
    mockFrom
      .mockReturnValueOnce(makeChain({ data: { role: "teacher" }, error: null }))
      .mockReturnValueOnce(makeChain({ data: null, error: null })); // course not found

    const res = await POST(makePostRequest({ session_id: "s1", due_date: "2024-12-01" }), { params });
    expect(res.status).toBe(403);
  });

  it("returns 400 when session_id is missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "t1" } }, error: null });
    mockFrom
      .mockReturnValueOnce(makeChain({ data: { role: "teacher" }, error: null }))
      .mockReturnValueOnce(makeChain({ data: { id: COURSE_ID }, error: null }));

    const res = await POST(makePostRequest({ due_date: "2024-12-01" }), { params });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "session_id and due_date are required" });
  });

  it("returns 400 when due_date is missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "t1" } }, error: null });
    mockFrom
      .mockReturnValueOnce(makeChain({ data: { role: "teacher" }, error: null }))
      .mockReturnValueOnce(makeChain({ data: { id: COURSE_ID }, error: null }));

    const res = await POST(makePostRequest({ session_id: "s1" }), { params });
    expect(res.status).toBe(400);
  });

  it("returns 404 when session not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "t1" } }, error: null });
    mockFrom
      .mockReturnValueOnce(makeChain({ data: { role: "teacher" }, error: null }))
      .mockReturnValueOnce(makeChain({ data: { id: COURSE_ID }, error: null }))
      .mockReturnValueOnce(makeChain({ data: null, error: null })); // session not found

    const res = await POST(makePostRequest({ session_id: "s1", due_date: "2024-12-01" }), { params });
    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({ error: "Session not found" });
  });

  it("returns 400 when session belongs to a different course", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "t1" } }, error: null });
    mockFrom
      .mockReturnValueOnce(makeChain({ data: { role: "teacher" }, error: null }))
      .mockReturnValueOnce(makeChain({ data: { id: COURSE_ID }, error: null }))
      .mockReturnValueOnce(makeChain({ data: { id: "s1", status: "completed", course_id: "other-course" }, error: null }));

    const res = await POST(makePostRequest({ session_id: "s1", due_date: "2024-12-01" }), { params });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "Session does not belong to this course" });
  });

  it("returns 400 when session is not completed", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "t1" } }, error: null });
    mockFrom
      .mockReturnValueOnce(makeChain({ data: { role: "teacher" }, error: null }))
      .mockReturnValueOnce(makeChain({ data: { id: COURSE_ID }, error: null }))
      .mockReturnValueOnce(makeChain({ data: { id: "s1", status: "draft", course_id: COURSE_ID }, error: null }));

    const res = await POST(makePostRequest({ session_id: "s1", due_date: "2024-12-01" }), { params });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "Only completed sessions can be assigned" });
  });

  it("returns 409 when session is already assigned", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "t1" } }, error: null });
    mockFrom
      .mockReturnValueOnce(makeChain({ data: { role: "teacher" }, error: null }))
      .mockReturnValueOnce(makeChain({ data: { id: COURSE_ID }, error: null }))
      .mockReturnValueOnce(makeChain({ data: { id: "s1", status: "completed", course_id: COURSE_ID }, error: null }))
      .mockReturnValueOnce(makeChain({ data: { id: "existing-a1" }, error: null })); // already assigned

    const res = await POST(makePostRequest({ session_id: "s1", due_date: "2024-12-01" }), { params });
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ error: "This session is already assigned" });
  });

  it("returns 500 when insert fails", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "t1" } }, error: null });
    mockFrom
      .mockReturnValueOnce(makeChain({ data: { role: "teacher" }, error: null }))
      .mockReturnValueOnce(makeChain({ data: { id: COURSE_ID }, error: null }))
      .mockReturnValueOnce(makeChain({ data: { id: "s1", status: "completed", course_id: COURSE_ID }, error: null }))
      .mockReturnValueOnce(makeChain({ data: null, error: null })) // not already assigned
      .mockReturnValueOnce(makeChain({ data: null, error: new Error("insert failed") })); // insert

    const res = await POST(makePostRequest({ session_id: "s1", due_date: "2024-12-01" }), { params });
    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ error: "Failed to create assignment" });
  });

  it("returns 201 with created assignment", async () => {
    const newAssignment = { id: "a-new", session_id: "s1", course_id: COURSE_ID, due_date: "2024-12-01" };
    mockGetUser.mockResolvedValue({ data: { user: { id: "t1" } }, error: null });
    mockFrom
      .mockReturnValueOnce(makeChain({ data: { role: "teacher" }, error: null }))
      .mockReturnValueOnce(makeChain({ data: { id: COURSE_ID }, error: null }))
      .mockReturnValueOnce(makeChain({ data: { id: "s1", status: "completed", course_id: COURSE_ID }, error: null }))
      .mockReturnValueOnce(makeChain({ data: null, error: null })) // not already assigned
      .mockReturnValueOnce(makeChain({ data: newAssignment, error: null })); // insert

    const res = await POST(makePostRequest({ session_id: "s1", due_date: "2024-12-01" }), { params });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.assignment).toMatchObject(newAssignment);
  });
});
