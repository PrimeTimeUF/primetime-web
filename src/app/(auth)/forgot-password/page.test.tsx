import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ForgotPasswordPage from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

global.fetch = vi.fn();

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the PrimeTime heading", () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByRole("heading", { name: "PrimeTime" })).toBeInTheDocument();
  });

  it("renders the email input", () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("renders Send Reset Link button", () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByRole("button", { name: /Send Reset Link/i })).toBeInTheDocument();
  });

  it("renders a back to login link", () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByRole("link", { name: /Back to login/i })).toHaveAttribute("href", "/login");
  });

  it("shows success state after successful submission", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "Reset email sent" }),
    } as Response);

    render(<ForgotPasswordPage />);
    await userEvent.type(screen.getByLabelText("Email"), "user@university.edu");
    await userEvent.click(screen.getByRole("button", { name: /Send Reset Link/i }));

    await waitFor(() => {
      expect(screen.getByText("Check your email")).toBeInTheDocument();
    });
  });

  it("shows the submitted email address in success state", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response);

    render(<ForgotPasswordPage />);
    await userEvent.type(screen.getByLabelText("Email"), "user@university.edu");
    await userEvent.click(screen.getByRole("button", { name: /Send Reset Link/i }));

    await waitFor(() => {
      expect(screen.getByText("user@university.edu")).toBeInTheDocument();
    });
  });

  it("shows API error when request fails", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "No account found" }),
    } as Response);

    render(<ForgotPasswordPage />);
    await userEvent.type(screen.getByLabelText("Email"), "nobody@test.com");
    await userEvent.click(screen.getByRole("button", { name: /Send Reset Link/i }));

    await waitFor(() => {
      expect(screen.getByText("No account found")).toBeInTheDocument();
    });
  });

  it("shows generic error on network failure", async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error("Network error"));

    render(<ForgotPasswordPage />);
    await userEvent.type(screen.getByLabelText("Email"), "user@test.com");
    await userEvent.click(screen.getByRole("button", { name: /Send Reset Link/i }));

    await waitFor(() => {
      expect(screen.getByText(/unexpected error/i)).toBeInTheDocument();
    });
  });

  it("shows loading state while submitting", async () => {
    vi.mocked(global.fetch).mockImplementation(() => new Promise(() => {}));

    render(<ForgotPasswordPage />);
    await userEvent.type(screen.getByLabelText("Email"), "user@test.com");
    await userEvent.click(screen.getByRole("button", { name: /Send Reset Link/i }));

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});
