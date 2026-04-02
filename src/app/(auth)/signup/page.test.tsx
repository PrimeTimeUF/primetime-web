import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SignUpPage from "./page";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("../auth-theme-context", () => ({
  useAuthTheme: () => ({ isDark: true, toggle: vi.fn() }),
}));

global.fetch = vi.fn();

async function fillValidForm(overrides: Partial<{
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: "student" | "teacher";
  acceptTerms: boolean;
}> = {}) {
  const opts = {
    fullName: "Jane Doe",
    email: "jane@university.edu",
    password: "SecurePass1!",
    confirmPassword: "SecurePass1!",
    role: "student" as const,
    acceptTerms: true,
    ...overrides,
  };

  await userEvent.type(screen.getByLabelText(/full name/i), opts.fullName);
  await userEvent.type(screen.getByLabelText(/^email$/i), opts.email);
  await userEvent.type(screen.getByLabelText(/^password$/i), opts.password);
  await userEvent.type(screen.getByLabelText(/confirm password/i), opts.confirmPassword);

  if (opts.role === "teacher") {
    await userEvent.click(screen.getByRole("button", { name: /Teacher/i }));
  }

  if (opts.acceptTerms) {
    await userEvent.click(screen.getByRole("checkbox"));
  }
}

describe("SignUpPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the Create Account heading", () => {
    render(<SignUpPage />);
    expect(screen.getByRole("heading", { name: /create account/i })).toBeInTheDocument();
  });

  it("renders all form fields", () => {
    render(<SignUpPage />);
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it("renders role selector", () => {
    render(<SignUpPage />);
    expect(screen.getByRole("button", { name: /Student/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Teacher/i })).toBeInTheDocument();
  });

  it("renders terms checkbox", () => {
    render(<SignUpPage />);
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });

  it("renders Create Account submit button", () => {
    render(<SignUpPage />);
    expect(screen.getByRole("button", { name: /Create Account/i })).toBeInTheDocument();
  });

  it("shows error when full name is empty on submit", async () => {
    render(<SignUpPage />);
    const form = document.querySelector("form")!;
    fireEvent.submit(form);
    await waitFor(() => {
      expect(screen.getByText("Full name is required")).toBeInTheDocument();
    });
  });

  it("shows error when passwords do not match", async () => {
    render(<SignUpPage />);
    await userEvent.type(screen.getByLabelText(/full name/i), "Jane");
    await userEvent.type(screen.getByLabelText(/^email$/i), "jane@test.com");
    await userEvent.type(screen.getByLabelText(/^password$/i), "Password1!");
    await userEvent.type(screen.getByLabelText(/confirm password/i), "DifferentPass1!");
    await userEvent.click(screen.getByRole("button", { name: /Create Account/i }));
    await waitFor(() => {
      expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
    });
  });

  it("shows error when password is too short", async () => {
    render(<SignUpPage />);
    await userEvent.type(screen.getByLabelText(/full name/i), "Jane");
    await userEvent.type(screen.getByLabelText(/^email$/i), "jane@test.com");
    await userEvent.type(screen.getByLabelText(/^password$/i), "short");
    await userEvent.type(screen.getByLabelText(/confirm password/i), "short");
    await userEvent.click(screen.getByRole("button", { name: /Create Account/i }));
    await waitFor(() => {
      expect(screen.getByText("Password must be at least 8 characters")).toBeInTheDocument();
    });
  });

  it("shows error when terms are not accepted", async () => {
    render(<SignUpPage />);
    await userEvent.type(screen.getByLabelText(/full name/i), "Jane");
    await userEvent.type(screen.getByLabelText(/^email$/i), "jane@test.com");
    await userEvent.type(screen.getByLabelText(/^password$/i), "Password1!");
    await userEvent.type(screen.getByLabelText(/confirm password/i), "Password1!");
    await userEvent.click(screen.getByRole("button", { name: /Create Account/i }));
    await waitFor(() => {
      expect(screen.getByText("You must accept the terms to continue")).toBeInTheDocument();
    });
  });

  it("shows weak password indicator for weak passwords", async () => {
    render(<SignUpPage />);
    await userEvent.type(screen.getByLabelText(/^password$/i), "weak");
    await waitFor(() => {
      expect(screen.getByText("WEAK")).toBeInTheDocument();
    });
  });

  it("shows strong password indicator for strong passwords", async () => {
    render(<SignUpPage />);
    await userEvent.type(screen.getByLabelText(/^password$/i), "StrongPass1!");
    await waitFor(() => {
      expect(screen.getByText("STRONG")).toBeInTheDocument();
    });
  });

  it("shows invalid email error on blur with bad email", async () => {
    render(<SignUpPage />);
    const emailInput = screen.getByLabelText(/^email$/i);
    await userEvent.type(emailInput, "notanemail");
    await userEvent.tab();
    await waitFor(() => {
      expect(screen.getByText("Please enter a valid email address")).toBeInTheDocument();
    });
  });

  it("shows API error when signup fails", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Email already in use" }),
    } as Response);

    render(<SignUpPage />);
    await fillValidForm();
    await userEvent.click(screen.getByRole("button", { name: /Create Account/i }));

    await waitFor(() => {
      expect(screen.getByText("Email already in use")).toBeInTheDocument();
    });
  });

  it("redirects to /student on successful student signup", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: { id: "1", email: "jane@test.com", role: "student" }, session: {} }),
    } as Response);

    render(<SignUpPage />);
    await fillValidForm({ role: "student" });
    await userEvent.click(screen.getByRole("button", { name: /Create Account/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/student");
    });
  });

  it("redirects to /teacher on successful teacher signup", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: { id: "1", email: "prof@test.com", role: "teacher" }, session: {} }),
    } as Response);

    render(<SignUpPage />);
    await fillValidForm({ role: "teacher" });
    await userEvent.click(screen.getByRole("button", { name: /Create Account/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/teacher");
    });
  });

  it("shows generic error on network failure", async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error("Network error"));
    render(<SignUpPage />);
    await fillValidForm();
    await userEvent.click(screen.getByRole("button", { name: /Create Account/i }));

    await waitFor(() => {
      expect(screen.getByText(/unexpected error/i)).toBeInTheDocument();
    });
  });

  it("renders link to login page", () => {
    render(<SignUpPage />);
    expect(screen.getByRole("link", { name: /Log in/i })).toHaveAttribute("href", "/login");
  });
});
