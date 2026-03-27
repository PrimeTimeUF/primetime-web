import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "./page";
import { AuthThemeContext } from "../auth-theme-context";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

global.fetch = vi.fn();

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <AuthThemeContext.Provider value={{ isDark: true, toggle: () => {} }}>
      {ui}
    </AuthThemeContext.Provider>
  );
}

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the SIGN IN heading", () => {
    renderWithTheme(<LoginPage />);
    expect(screen.getByRole("heading", { name: "SIGN IN" })).toBeInTheDocument();
  });

  it("renders email and password inputs", () => {
    renderWithTheme(<LoginPage />);
    expect(screen.getByPlaceholderText("user@university.edu")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
  });

  it("renders role selector with STUDENT and TEACHER options", () => {
    renderWithTheme(<LoginPage />);
    expect(screen.getByRole("button", { name: /STUDENT/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /TEACHER/i })).toBeInTheDocument();
  });

  it("defaults to student role selected", () => {
    renderWithTheme(<LoginPage />);
    // Student button should have the full border (border-white) when selected in dark mode
    const studentBtn = screen.getByRole("button", { name: /STUDENT/i });
    expect(studentBtn.className).toMatch(/border-white\b/);
  });

  it("switches to teacher role when TEACHER is clicked", async () => {
    renderWithTheme(<LoginPage />);
    await userEvent.click(screen.getByRole("button", { name: /TEACHER/i }));
    const teacherBtn = screen.getByRole("button", { name: /TEACHER/i });
    expect(teacherBtn.className).toMatch(/border-white\b/);
  });

  it("renders a LOG IN submit button", () => {
    renderWithTheme(<LoginPage />);
    expect(screen.getByRole("button", { name: /LOG IN/i })).toBeInTheDocument();
  });

  it("renders a link to forgot password", () => {
    renderWithTheme(<LoginPage />);
    expect(screen.getByRole("link", { name: /FORGOT PASSWORD/i })).toHaveAttribute("href", "/forgot-password");
  });

  it("renders a link to register", () => {
    renderWithTheme(<LoginPage />);
    expect(screen.getByRole("link", { name: /REGISTER/i })).toHaveAttribute("href", "/signup");
  });

  it("shows loading state while submitting", async () => {
    vi.mocked(global.fetch).mockImplementation(() => new Promise(() => {}));
    renderWithTheme(<LoginPage />);
    await userEvent.type(screen.getByPlaceholderText("user@university.edu"), "test@test.com");
    await userEvent.type(screen.getByPlaceholderText("••••••••"), "password123");
    await userEvent.click(screen.getByRole("button", { name: /LOG IN/i }));
    expect(screen.getByText("AUTHENTICATING...")).toBeInTheDocument();
  });

  it("shows API error when login fails", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Invalid credentials" }),
    } as Response);

    renderWithTheme(<LoginPage />);
    await userEvent.type(screen.getByPlaceholderText("user@university.edu"), "bad@test.com");
    await userEvent.type(screen.getByPlaceholderText("••••••••"), "wrongpass");
    await userEvent.click(screen.getByRole("button", { name: /LOG IN/i }));

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });
  });

  it("shows role mismatch error when user role does not match selected role", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: { role: "teacher" }, session: {} }),
    } as Response);

    renderWithTheme(<LoginPage />);
    // Select student role (default) but API returns teacher
    await userEvent.type(screen.getByPlaceholderText("user@university.edu"), "teacher@test.com");
    await userEvent.type(screen.getByPlaceholderText("••••••••"), "pass123");
    await userEvent.click(screen.getByRole("button", { name: /LOG IN/i }));

    await waitFor(() => {
      expect(screen.getByText(/registered as a teacher/i)).toBeInTheDocument();
    });
  });

  it("redirects to /teacher on successful teacher login", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: { role: "teacher" }, session: {} }),
    } as Response);

    renderWithTheme(<LoginPage />);
    await userEvent.click(screen.getByRole("button", { name: /TEACHER/i }));
    await userEvent.type(screen.getByPlaceholderText("user@university.edu"), "teacher@test.com");
    await userEvent.type(screen.getByPlaceholderText("••••••••"), "pass123");
    await userEvent.click(screen.getByRole("button", { name: /LOG IN/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/teacher");
    });
  });

  it("redirects to /student on successful student login", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: { role: "student" }, session: {} }),
    } as Response);

    renderWithTheme(<LoginPage />);
    await userEvent.type(screen.getByPlaceholderText("user@university.edu"), "student@test.com");
    await userEvent.type(screen.getByPlaceholderText("••••••••"), "pass123");
    await userEvent.click(screen.getByRole("button", { name: /LOG IN/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/student");
    });
  });

  it("shows generic error on network failure", async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error("Network error"));
    renderWithTheme(<LoginPage />);
    await userEvent.type(screen.getByPlaceholderText("user@university.edu"), "test@test.com");
    await userEvent.type(screen.getByPlaceholderText("••••••••"), "pass123");
    await userEvent.click(screen.getByRole("button", { name: /LOG IN/i }));

    await waitFor(() => {
      expect(screen.getByText(/unexpected error/i)).toBeInTheDocument();
    });
  });
});
