import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ResetPasswordPage from "./page";

const mockPush = vi.fn();
const mockUpdateUser = vi.fn();
const mockSignOut = vi.fn();
const mockGetUser = vi.fn();
const mockUnsubscribe = vi.fn();
const mockOnAuthStateChange = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/utils/supabase/client", () => ({
  createClient: () => ({
    auth: {
      updateUser: mockUpdateUser,
      signOut: mockSignOut,
      getUser: mockGetUser,
      onAuthStateChange: mockOnAuthStateChange,
    },
  }),
}));

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    });
    mockGetUser.mockResolvedValue({ data: { user: null } });
  });

  it("renders the PrimeTime heading", () => {
    render(<ResetPasswordPage />);
    expect(screen.getByRole("heading", { name: "PrimeTime" })).toBeInTheDocument();
  });

  it("shows invalid link state when session is not ready", () => {
    render(<ResetPasswordPage />);
    expect(screen.getByText("Invalid or expired reset link")).toBeInTheDocument();
  });

  it("shows a link to request a new reset link when session is invalid", () => {
    render(<ResetPasswordPage />);
    expect(screen.getByRole("link", { name: /Request new reset link/i })).toHaveAttribute(
      "href",
      "/forgot-password"
    );
  });

  it("shows the reset form when session is ready (user exists)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    render(<ResetPasswordPage />);

    await waitFor(() => {
      expect(screen.getByLabelText("New Password")).toBeInTheDocument();
      expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
    });
  });

  it("shows error when password is too short", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    render(<ResetPasswordPage />);

    await waitFor(() => screen.getByLabelText("New Password"));

    await userEvent.type(screen.getByLabelText("New Password"), "short");
    await userEvent.type(screen.getByLabelText("Confirm Password"), "short");
    await userEvent.click(screen.getByRole("button", { name: /Reset Password/i }));

    await waitFor(() => {
      expect(screen.getByText("Password must be at least 8 characters long.")).toBeInTheDocument();
    });
  });

  it("shows error when passwords do not match", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    render(<ResetPasswordPage />);

    await waitFor(() => screen.getByLabelText("New Password"));

    await userEvent.type(screen.getByLabelText("New Password"), "Password123!");
    await userEvent.type(screen.getByLabelText("Confirm Password"), "DifferentPass!");
    await userEvent.click(screen.getByRole("button", { name: /Reset Password/i }));

    await waitFor(() => {
      expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
    });
  });

  it("shows success state after successful password reset", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockUpdateUser.mockResolvedValue({ error: null });
    mockSignOut.mockResolvedValue({});

    render(<ResetPasswordPage />);

    await waitFor(() => screen.getByLabelText("New Password"));

    await userEvent.type(screen.getByLabelText("New Password"), "NewPassword1!");
    await userEvent.type(screen.getByLabelText("Confirm Password"), "NewPassword1!");
    await userEvent.click(screen.getByRole("button", { name: /Reset Password/i }));

    await waitFor(() => {
      expect(screen.getByText("Password reset successful")).toBeInTheDocument();
    });
  });

  it("shows API error when updateUser fails", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockUpdateUser.mockResolvedValue({ error: { message: "Session expired" } });

    render(<ResetPasswordPage />);

    await waitFor(() => screen.getByLabelText("New Password"));

    await userEvent.type(screen.getByLabelText("New Password"), "NewPassword1!");
    await userEvent.type(screen.getByLabelText("Confirm Password"), "NewPassword1!");
    await userEvent.click(screen.getByRole("button", { name: /Reset Password/i }));

    await waitFor(() => {
      expect(screen.getByText("Session expired")).toBeInTheDocument();
    });
  });

  it("navigates to /login when Go to Login is clicked in success state", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockUpdateUser.mockResolvedValue({ error: null });
    mockSignOut.mockResolvedValue({});

    render(<ResetPasswordPage />);

    await waitFor(() => screen.getByLabelText("New Password"));

    await userEvent.type(screen.getByLabelText("New Password"), "NewPassword1!");
    await userEvent.type(screen.getByLabelText("Confirm Password"), "NewPassword1!");
    await userEvent.click(screen.getByRole("button", { name: /Reset Password/i }));

    await waitFor(() => screen.getByRole("button", { name: /Go to Login/i }));

    await userEvent.click(screen.getByRole("button", { name: /Go to Login/i }));
    expect(mockPush).toHaveBeenCalledWith("/login");
  });
});
