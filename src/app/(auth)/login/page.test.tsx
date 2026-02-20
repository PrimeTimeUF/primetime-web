import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "./page";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

global.fetch = vi.fn();

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the PrimeTime brand heading", () => {
    render(<LoginPage />);
    expect(screen.getByRole("heading", { name: "PrimeTime" })).toBeInTheDocument();
  });

  it("renders email and password inputs", () => {
    render(<LoginPage />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("renders role selector with Student and Teacher options", () => {
    render(<LoginPage />);
    expect(screen.getByRole("button", { name: /Student/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Teacher/i })).toBeInTheDocument();
  });

  it("defaults to student role selected", () => {
    render(<LoginPage />);
    // Student button should have the selected styling (black background)
    const studentBtn = screen.getByRole("button", { name: /Student/i });
    expect(studentBtn.className).toMatch(/bg-black/);
  });

  it("switches to teacher role when Teacher is clicked", async () => {
    render(<LoginPage />);
    await userEvent.click(screen.getByRole("button", { name: /Teacher/i }));
    const teacherBtn = screen.getByRole("button", { name: /Teacher/i });
    expect(teacherBtn.className).toMatch(/bg-black/);
  });

  it("renders a Log In submit button", () => {
    render(<LoginPage />);
    expect(screen.getByRole("button", { name: /Log In/i })).toBeInTheDocument();
  });

  it("renders a link to forgot password", () => {
    render(<LoginPage />);
    expect(screen.getByRole("link", { name: /Forgot password/i })).toHaveAttribute("href", "/forgot-password");
  });

  it("renders a link to sign up", () => {
    render(<LoginPage />);
    expect(screen.getByRole("link", { name: /Sign up/i })).toHaveAttribute("href", "/signup");
  });

  it("shows loading state while submitting", async () => {
    vi.mocked(global.fetch).mockImplementation(() => new Promise(() => {}));
    render(<LoginPage />);
    await userEvent.type(screen.getByLabelText("Email"), "test@test.com");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.click(screen.getByRole("button", { name: /Log In/i }));
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows API error when login fails", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Invalid credentials" }),
    } as Response);

    render(<LoginPage />);
    await userEvent.type(screen.getByLabelText("Email"), "bad@test.com");
    await userEvent.type(screen.getByLabelText("Password"), "wrongpass");
    await userEvent.click(screen.getByRole("button", { name: /Log In/i }));

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });
  });

  it("shows role mismatch error when user role does not match selected role", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: { role: "teacher" }, session: {} }),
    } as Response);

    render(<LoginPage />);
    // Select student role (default) but API returns teacher
    await userEvent.type(screen.getByLabelText("Email"), "teacher@test.com");
    await userEvent.type(screen.getByLabelText("Password"), "pass123");
    await userEvent.click(screen.getByRole("button", { name: /Log In/i }));

    await waitFor(() => {
      expect(screen.getByText(/registered as a teacher/i)).toBeInTheDocument();
    });
  });

  it("redirects to /teacher on successful teacher login", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: { role: "teacher" }, session: {} }),
    } as Response);

    render(<LoginPage />);
    await userEvent.click(screen.getByRole("button", { name: /Teacher/i }));
    await userEvent.type(screen.getByLabelText("Email"), "teacher@test.com");
    await userEvent.type(screen.getByLabelText("Password"), "pass123");
    await userEvent.click(screen.getByRole("button", { name: /Log In/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/teacher");
    });
  });

  it("redirects to /student on successful student login", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: { role: "student" }, session: {} }),
    } as Response);

    render(<LoginPage />);
    await userEvent.type(screen.getByLabelText("Email"), "student@test.com");
    await userEvent.type(screen.getByLabelText("Password"), "pass123");
    await userEvent.click(screen.getByRole("button", { name: /Log In/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/student");
    });
  });

  it("shows generic error on network failure", async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error("Network error"));
    render(<LoginPage />);
    await userEvent.type(screen.getByLabelText("Email"), "test@test.com");
    await userEvent.type(screen.getByLabelText("Password"), "pass123");
    await userEvent.click(screen.getByRole("button", { name: /Log In/i }));

    await waitFor(() => {
      expect(screen.getByText(/unexpected error/i)).toBeInTheDocument();
    });
  });
});
