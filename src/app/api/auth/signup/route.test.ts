import { POST } from "./route";

const mockSignUp = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: {
      signUp: mockSignUp,
    },
    from: mockFrom,
  })),
}));

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = {
  email: "new@test.com",
  password: "SecurePass1!",
  role: "student",
  fullName: "New User",
};

describe("POST /api/auth/signup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when email is missing", async () => {
    const res = await POST(makeRequest({ password: "pass", role: "student", fullName: "Name" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Missing required fields");
  });

  it("returns 400 when password is missing", async () => {
    const res = await POST(makeRequest({ email: "a@b.com", role: "student", fullName: "Name" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Missing required fields");
  });

  it("returns 400 when role is missing", async () => {
    const res = await POST(makeRequest({ email: "a@b.com", password: "pass", fullName: "Name" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Missing required fields");
  });

  it("returns 400 when fullName is missing", async () => {
    const res = await POST(makeRequest({ email: "a@b.com", password: "pass", role: "student" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Missing required fields");
  });

  it("returns 400 for invalid role", async () => {
    const res = await POST(makeRequest({ ...validBody, role: "admin" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/Invalid role/);
  });

  it("returns 400 when password is too short", async () => {
    const res = await POST(makeRequest({ ...validBody, password: "short" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Password must be at least 8 characters long");
  });

  it("returns 400 when Supabase auth signUp fails", async () => {
    mockSignUp.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: "Email already registered" },
    });

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Email already registered");
  });

  it("returns 201 with user data on successful signup (with session)", async () => {
    mockSignUp.mockResolvedValueOnce({
      data: {
        user: { id: "user-1" },
        session: { access_token: "tok" },
      },
      error: null,
    });

    const mockInsert = vi.fn().mockResolvedValueOnce({ error: null });
    mockFrom.mockReturnValue({ insert: mockInsert });

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.user).toEqual({
      id: "user-1",
      email: "new@test.com",
      role: "student",
      fullName: "New User",
    });
  });

  it("returns 500 when user table insert fails", async () => {
    mockSignUp.mockResolvedValueOnce({
      data: {
        user: { id: "user-1" },
        session: { access_token: "tok" },
      },
      error: null,
    });

    const mockInsert = vi.fn().mockResolvedValueOnce({
      error: { message: "Duplicate key" },
    });
    mockFrom.mockReturnValue({ insert: mockInsert });

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toMatch(/Failed to create user profile/);
  });
});
