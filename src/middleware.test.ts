import { NextRequest } from "next/server";
import { middleware } from "./middleware";

const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockSingle = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: mockSingle,
    })),
  })),
}));

function makeRequest(pathname: string) {
  return new NextRequest(new URL(`http://localhost${pathname}`));
}

describe("middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Unauthenticated access to protected routes ---

  it("redirects unauthenticated user from /teacher to /login", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const res = await middleware(makeRequest("/teacher"));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("redirects unauthenticated user from /student to /login", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const res = await middleware(makeRequest("/student"));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("redirects unauthenticated user from /teacher/courses/123 to /login", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const res = await middleware(makeRequest("/teacher/courses/123"));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });

  // --- Authenticated user accessing correct dashboard ---

  it("allows authenticated teacher to access /teacher", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    mockSingle.mockResolvedValue({ data: { role: "teacher" }, error: null });

    const res = await middleware(makeRequest("/teacher"));

    expect(res.status).not.toBe(307);
  });

  it("allows authenticated student to access /student", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u2" } }, error: null });
    mockSingle.mockResolvedValue({ data: { role: "student" }, error: null });

    const res = await middleware(makeRequest("/student"));

    expect(res.status).not.toBe(307);
  });

  // --- Role mismatch redirects ---

  it("redirects teacher accessing /student to /teacher", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    mockSingle.mockResolvedValue({ data: { role: "teacher" }, error: null });

    const res = await middleware(makeRequest("/student"));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/teacher");
  });

  it("redirects student accessing /teacher to /student", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u2" } }, error: null });
    mockSingle.mockResolvedValue({ data: { role: "student" }, error: null });

    const res = await middleware(makeRequest("/teacher"));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/student");
  });

  // --- Authenticated user on auth pages ---

  it("redirects authenticated teacher away from /login to /teacher", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    mockSingle.mockResolvedValue({ data: { role: "teacher" }, error: null });

    const res = await middleware(makeRequest("/login"));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/teacher");
  });

  it("redirects authenticated student away from /login to /student", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u2" } }, error: null });
    mockSingle.mockResolvedValue({ data: { role: "student" }, error: null });

    const res = await middleware(makeRequest("/login"));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/student");
  });

  it("redirects authenticated teacher away from /signup to /teacher", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    mockSingle.mockResolvedValue({ data: { role: "teacher" }, error: null });

    const res = await middleware(makeRequest("/signup"));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/teacher");
  });

  it("redirects authenticated teacher away from /forgot-password to /teacher", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    mockSingle.mockResolvedValue({ data: { role: "teacher" }, error: null });

    const res = await middleware(makeRequest("/forgot-password"));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/teacher");
  });

  it("redirects authenticated teacher away from / to /teacher", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    mockSingle.mockResolvedValue({ data: { role: "teacher" }, error: null });

    const res = await middleware(makeRequest("/"));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/teacher");
  });

  // --- Unauthenticated user on public routes passes through ---

  it("allows unauthenticated user to access /login", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const res = await middleware(makeRequest("/login"));

    expect(res.status).not.toBe(307);
  });

  it("allows unauthenticated user to access /signup", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const res = await middleware(makeRequest("/signup"));

    expect(res.status).not.toBe(307);
  });

  it("allows unauthenticated user to access /", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const res = await middleware(makeRequest("/"));

    expect(res.status).not.toBe(307);
  });

  // --- userData null (no DB record) ---

  it("passes through when user exists but no userData found on dashboard route", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    mockSingle.mockResolvedValue({ data: null, error: null });

    const res = await middleware(makeRequest("/teacher"));

    expect(res.status).not.toBe(307);
  });

  it("passes through when user exists but no userData found on auth page", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    mockSingle.mockResolvedValue({ data: null, error: null });

    const res = await middleware(makeRequest("/login"));

    expect(res.status).not.toBe(307);
  });
});
