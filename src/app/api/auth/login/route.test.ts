import { POST } from "./route";

const mockSignInWithPassword = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
    },
    from: mockFrom,
  })),
}));

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when email is missing", async () => {
    const res = await POST(makeRequest({ password: "pass123" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Email and password are required");
  });

  it("returns 400 when password is missing", async () => {
    const res = await POST(makeRequest({ email: "user@test.com" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Email and password are required");
  });

  it("returns 401 when Supabase auth fails", async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: "Invalid login credentials" },
    });

    const res = await POST(makeRequest({ email: "user@test.com", password: "wrong" }));
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Invalid login credentials");
  });

  it("returns 401 when auth data has no user", async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: null,
    });

    const res = await POST(makeRequest({ email: "user@test.com", password: "pass123" }));
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Failed to authenticate user");
  });

  it("returns 500 when user profile fetch fails", async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: { id: "user-1" }, session: {} },
      error: null,
    });

    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValueOnce({
      data: null,
      error: { message: "DB error" },
    });

    mockFrom.mockReturnValue({ select: mockSelect, eq: mockEq, single: mockSingle });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ single: mockSingle });

    const res = await POST(makeRequest({ email: "user@test.com", password: "pass123" }));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("Failed to fetch user profile");
  });

  it("returns 200 with user data on successful login", async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: {
        user: { id: "user-1" },
        session: { access_token: "tok" },
      },
      error: null,
    });

    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValueOnce({
      data: {
        id: "user-1",
        email: "user@test.com",
        role: "student",
        full_name: "Test User",
      },
      error: null,
    });

    mockFrom.mockReturnValue({ select: mockSelect, eq: mockEq, single: mockSingle });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ single: mockSingle });

    const res = await POST(makeRequest({ email: "user@test.com", password: "pass123" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user).toEqual({
      id: "user-1",
      email: "user@test.com",
      role: "student",
      fullName: "Test User",
    });
    expect(data.session).toBeDefined();
  });
});
