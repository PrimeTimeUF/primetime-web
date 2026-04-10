import { POST } from "./route";

const mockGetUser = vi.fn();
const mockSupabaseFrom = vi.fn();
const mockAdminFrom = vi.fn();
const mockStorageFrom = vi.fn();
const mockDownload = vi.fn();
const mockExtractTextFromPdf = vi.fn();
const mockGeneratePrimingSession = vi.fn();

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockSupabaseFrom,
  })),
}));

vi.mock("@/lib/supabase-admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: mockAdminFrom,
    storage: {
      from: mockStorageFrom,
    },
  })),
}));

vi.mock("@/lib/pdf", () => ({
  extractTextFromPdf: (...args: unknown[]) => mockExtractTextFromPdf(...args),
}));

vi.mock("@/lib/anthropic", () => ({
  generatePrimingSession: (...args: unknown[]) =>
    mockGeneratePrimingSession(...args),
}));

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/courses/course-1/sessions/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeSingleChain(result: unknown) {
  const chain = {
    select: vi.fn(),
    eq: vi.fn(),
    single: vi.fn(),
  };

  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.single.mockResolvedValue(result);

  return chain;
}

function makeMaterialsChain(result: unknown) {
  const chain = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
  };

  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.order.mockResolvedValue(result);

  return chain;
}

describe("POST /api/courses/[id]/sessions/generate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: "teacher-1" } }, error: null });
    mockStorageFrom.mockReturnValue({ download: mockDownload });
    mockDownload.mockResolvedValue({
      data: { arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)) },
      error: null,
    });
    mockExtractTextFromPdf.mockResolvedValue("Extracted PDF text");
    mockGeneratePrimingSession.mockResolvedValue({
      title: "Lecture Session",
      content: "Session content",
      questions: [
        {
          question_number: 1,
          question_text: "Q1",
          option_a: "A",
          option_b: "B",
          option_c: "C",
          option_d: "D",
          correct_answer: "A",
          explanation: "Because",
        },
      ],
    });
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    const res = await POST(makeRequest({ lectureName: "Week 1", duration: 10 }), {
      params: Promise.resolve({ id: "course-1" }),
    });

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
  });

  it("returns 401 when auth provider returns an auth error", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "teacher-1" } },
      error: { message: "token invalid" },
    });

    const res = await POST(makeRequest({ lectureName: "Week 1", duration: 10 }), {
      params: Promise.resolve({ id: "course-1" }),
    });

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
  });

  it("returns 403 when current user does not own course", async () => {
    const courseChain = makeSingleChain({ data: { teacher_id: "teacher-2" }, error: null });
    mockSupabaseFrom.mockReturnValueOnce(courseChain);

    const res = await POST(makeRequest({ lectureName: "Week 1", duration: 10 }), {
      params: Promise.resolve({ id: "course-1" }),
    });

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Forbidden" });
  });

  it("returns 400 when lectureName is missing", async () => {
    const courseChain = makeSingleChain({ data: { teacher_id: "teacher-1" }, error: null });
    mockSupabaseFrom.mockReturnValueOnce(courseChain);

    const res = await POST(makeRequest({ duration: 10 }), {
      params: Promise.resolve({ id: "course-1" }),
    });

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "lectureName is required" });
  });

  it("returns 400 when duration is invalid", async () => {
    const courseChain = makeSingleChain({ data: { teacher_id: "teacher-1" }, error: null });
    mockSupabaseFrom.mockReturnValueOnce(courseChain);

    const res = await POST(makeRequest({ lectureName: "Week 1", duration: 20 }), {
      params: Promise.resolve({ id: "course-1" }),
    });

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "duration must be 10, 15, or 30" });
  });

  it("returns 500 when material query fails", async () => {
    const courseChain = makeSingleChain({ data: { teacher_id: "teacher-1" }, error: null });
    const materialsChain = makeMaterialsChain({
      data: null,
      error: { message: "db failed" },
    });

    mockSupabaseFrom.mockReturnValueOnce(courseChain);
    mockAdminFrom.mockReturnValueOnce(materialsChain);

    const res = await POST(makeRequest({ lectureName: "Week 1", duration: 10 }), {
      params: Promise.resolve({ id: "course-1" }),
    });

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Failed to fetch materials" });
  });

  it("returns 404 when no matching PDF materials are found", async () => {
    const courseChain = makeSingleChain({ data: { teacher_id: "teacher-1" }, error: null });
    const materialsChain = makeMaterialsChain({ data: [], error: null });

    mockSupabaseFrom.mockReturnValueOnce(courseChain);
    mockAdminFrom.mockReturnValueOnce(materialsChain);

    const res = await POST(makeRequest({ lectureName: "Week 1", duration: 10 }), {
      params: Promise.resolve({ id: "course-1" }),
    });

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "No PDF materials found for this lecture" });
  });

  it("returns 500 when creating the session row fails", async () => {
    const courseChain = makeSingleChain({ data: { teacher_id: "teacher-1" }, error: null });
    const materialsChain = makeMaterialsChain({
      data: [{ id: "m1", file_url: "w1.pdf", file_name: "Week1.pdf", file_type: "application/pdf" }],
      error: null,
    });
    const insertChain = {
      insert: vi.fn(),
      select: vi.fn(),
      single: vi.fn(),
    };
    insertChain.insert.mockReturnValue(insertChain);
    insertChain.select.mockReturnValue(insertChain);
    insertChain.single.mockResolvedValue({ data: null, error: { message: "insert fail" } });

    mockSupabaseFrom.mockReturnValueOnce(courseChain);
    mockAdminFrom.mockReturnValueOnce(materialsChain).mockReturnValueOnce(insertChain);

    const res = await POST(makeRequest({ lectureName: "Week 1", duration: 10 }), {
      params: Promise.resolve({ id: "course-1" }),
    });

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Failed to create session" });
  });

  it("returns 202 and kicks off background generation on success", async () => {
    const courseChain = makeSingleChain({ data: { teacher_id: "teacher-1" }, error: null });
    const materials = [
      { id: "m1", file_url: "w1.pdf", file_name: "Week1.pdf", file_type: "application/pdf" },
    ];
    const materialsChain = makeMaterialsChain({ data: materials, error: null });
    const insertChain = {
      insert: vi.fn(),
      select: vi.fn(),
      single: vi.fn(),
    };
    insertChain.insert.mockReturnValue(insertChain);
    insertChain.select.mockReturnValue(insertChain);
    insertChain.single.mockResolvedValue({ data: { id: "session-1" }, error: null });

    const updateEq = vi.fn().mockResolvedValue({ data: null, error: null });
    const updateChain = { eq: updateEq };
    const primingSessionsUpdateChain = { update: vi.fn().mockReturnValue(updateChain) };
    const questionsInsertChain = {
      insert: vi.fn().mockResolvedValue({ error: null }),
    };

    mockSupabaseFrom.mockReturnValueOnce(courseChain);
    mockAdminFrom
      .mockReturnValueOnce(materialsChain)
      .mockReturnValueOnce(insertChain)
      .mockImplementation((table: string) => {
        if (table === "priming_sessions") return primingSessionsUpdateChain;
        if (table === "session_questions") return questionsInsertChain;
        throw new Error(`Unexpected table ${table}`);
      });

    const res = await POST(makeRequest({ lectureName: "Week 1", duration: 10 }), {
      params: Promise.resolve({ id: "course-1" }),
    });

    expect(res.status).toBe(202);
    expect(await res.json()).toEqual({
      message: "Generation started",
      session_id: "session-1",
    });
    expect(insertChain.insert).toHaveBeenCalledWith({
      course_id: "course-1",
      lecture_name: "Week 1",
      duration: 10,
      status: "generating",
    });
    expect(materialsChain.eq).toHaveBeenNthCalledWith(1, "course_id", "course-1");
    expect(materialsChain.eq).toHaveBeenNthCalledWith(2, "lecture_name", "Week 1");
    expect(materialsChain.eq).toHaveBeenNthCalledWith(
      3,
      "file_type",
      "application/pdf"
    );
    expect(materialsChain.order).toHaveBeenCalledWith("uploaded_at", {
      ascending: true,
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockStorageFrom).toHaveBeenCalledWith("course-materials");
    expect(mockDownload).toHaveBeenCalledWith("w1.pdf");
    expect(mockExtractTextFromPdf).toHaveBeenCalled();
    expect(mockGeneratePrimingSession).toHaveBeenCalledWith(
      expect.stringContaining("Extracted PDF text"),
      "Week 1",
      10
    );
    expect(questionsInsertChain.insert).toHaveBeenCalledTimes(1);
    expect(primingSessionsUpdateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "completed", title: "Lecture Session" })
    );
  });

  it("marks session as failed when background generation throws", async () => {
    const courseChain = makeSingleChain({ data: { teacher_id: "teacher-1" }, error: null });
    const materials = [
      { id: "m1", file_url: "w1.pdf", file_name: "Week1.pdf", file_type: "application/pdf" },
    ];
    const materialsChain = makeMaterialsChain({ data: materials, error: null });
    const insertChain = {
      insert: vi.fn(),
      select: vi.fn(),
      single: vi.fn(),
    };
    insertChain.insert.mockReturnValue(insertChain);
    insertChain.select.mockReturnValue(insertChain);
    insertChain.single.mockResolvedValue({ data: { id: "session-2" }, error: null });

    const updateEq = vi.fn().mockResolvedValue({ data: null, error: null });
    const updateChain = { eq: updateEq };
    const primingSessionsUpdateChain = { update: vi.fn().mockReturnValue(updateChain) };
    const questionsInsertChain = {
      insert: vi.fn().mockResolvedValue({ error: null }),
    };

    mockGeneratePrimingSession.mockRejectedValueOnce(new Error("anthropic down"));

    mockSupabaseFrom.mockReturnValueOnce(courseChain);
    mockAdminFrom
      .mockReturnValueOnce(materialsChain)
      .mockReturnValueOnce(insertChain)
      .mockImplementation((table: string) => {
        if (table === "priming_sessions") return primingSessionsUpdateChain;
        if (table === "session_questions") return questionsInsertChain;
        throw new Error(`Unexpected table ${table}`);
      });

    const res = await POST(makeRequest({ lectureName: "Week 1", duration: 10 }), {
      params: Promise.resolve({ id: "course-1" }),
    });

    expect(res.status).toBe(202);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(primingSessionsUpdateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "failed",
        error_message: "anthropic down",
      })
    );
    expect(updateEq).toHaveBeenCalledWith("id", "session-2");
    expect(questionsInsertChain.insert).not.toHaveBeenCalled();
  });
});
