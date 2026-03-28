import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import StudentProfilePage from "./page";

global.fetch = vi.fn();

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockProfile = {
  id: "user-1",
  email: "student@test.com",
  role: "student",
  full_name: "Jane Student",
  profile_image_url: null,
  created_at: "2025-01-15T00:00:00Z",
};

function mockProfileFetch(profile = mockProfile) {
  vi.mocked(global.fetch).mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => ({ profile }),
  } as Response);
}

describe("StudentProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state initially", () => {
    vi.mocked(global.fetch).mockImplementation(() => new Promise(() => {}));
    render(<StudentProfilePage />);
    expect(screen.getByText("LOADING...")).toBeInTheDocument();
  });

  it("fetches profile on mount", async () => {
    mockProfileFetch();
    render(<StudentProfilePage />);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/profile");
    });
  });

  it("redirects to login on 401", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({}),
    } as Response);
    render(<StudentProfilePage />);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });

  it("shows error state on fetch failure", async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error("Network error"));
    render(<StudentProfilePage />);
    await waitFor(() => {
      expect(screen.getByText("ERROR LOADING PROFILE")).toBeInTheDocument();
    });
  });

  it("renders profile information after loading", async () => {
    mockProfileFetch();
    render(<StudentProfilePage />);
    await waitFor(() => {
      expect(screen.getByText("PROFILE & SETTINGS")).toBeInTheDocument();
    });
    expect(screen.getByText("PROFILE INFORMATION")).toBeInTheDocument();
    expect(screen.getByText("CHANGE PASSWORD", { selector: "h2" })).toBeInTheDocument();
    expect(screen.getByText("ACCOUNT INFORMATION")).toBeInTheDocument();
  });

  it("displays email as disabled input", async () => {
    mockProfileFetch();
    render(<StudentProfilePage />);
    await waitFor(() => {
      expect(screen.getByDisplayValue("student@test.com")).toBeInTheDocument();
    });
    expect(screen.getByText("Email cannot be changed")).toBeInTheDocument();
  });

  it("displays account type and member since", async () => {
    mockProfileFetch();
    render(<StudentProfilePage />);
    await waitFor(() => {
      expect(screen.getByText("student")).toBeInTheDocument();
    });
    expect(screen.getByText("ACCOUNT TYPE")).toBeInTheDocument();
    expect(screen.getByText("MEMBER SINCE")).toBeInTheDocument();
  });

  it("shows initials when no profile image", async () => {
    mockProfileFetch();
    render(<StudentProfilePage />);
    await waitFor(() => {
      expect(screen.getByText("JS")).toBeInTheDocument();
    });
  });

  it("validates empty name on save", async () => {
    mockProfileFetch();
    render(<StudentProfilePage />);
    await waitFor(() => {
      expect(screen.getByDisplayValue("Jane Student")).toBeInTheDocument();
    });

    const nameInput = screen.getByDisplayValue("Jane Student");
    await userEvent.clear(nameInput);

    await userEvent.click(screen.getByRole("button", { name: /SAVE CHANGES/ }));
    expect(screen.getByText("Full name is required")).toBeInTheDocument();
  });

  it("saves profile successfully", async () => {
    mockProfileFetch();
    render(<StudentProfilePage />);
    await waitFor(() => {
      expect(screen.getByDisplayValue("Jane Student")).toBeInTheDocument();
    });

    const nameInput = screen.getByDisplayValue("Jane Student");
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Jane Updated");

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ profile: { ...mockProfile, full_name: "Jane Updated" } }),
    } as Response);

    await userEvent.click(screen.getByRole("button", { name: /SAVE CHANGES/ }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/profile",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ full_name: "Jane Updated" }),
        })
      );
    });
    expect(screen.getByText("Profile updated successfully!")).toBeInTheDocument();
  });

  it("shows save error from API", async () => {
    mockProfileFetch();
    render(<StudentProfilePage />);
    await waitFor(() => {
      expect(screen.getByDisplayValue("Jane Student")).toBeInTheDocument();
    });

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Update failed" }),
    } as Response);

    await userEvent.click(screen.getByRole("button", { name: /SAVE CHANGES/ }));

    await waitFor(() => {
      expect(screen.getByText("Update failed")).toBeInTheDocument();
    });
  });

  it("validates all password fields required", async () => {
    mockProfileFetch();
    render(<StudentProfilePage />);
    await waitFor(() => {
      expect(screen.getByText("CHANGE PASSWORD", { selector: "h2" })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: /CHANGE PASSWORD/ }));

    expect(screen.getByText("All password fields are required")).toBeInTheDocument();
  });

  it("validates new password minimum length", async () => {
    mockProfileFetch();
    render(<StudentProfilePage />);
    await waitFor(() => {
      expect(screen.getByText("CHANGE PASSWORD", { selector: "h2" })).toBeInTheDocument();
    });

    await userEvent.type(screen.getByPlaceholderText("Enter current password"), "oldpass");
    await userEvent.type(screen.getByPlaceholderText(/Enter new password/), "short");
    await userEvent.type(screen.getByPlaceholderText("Confirm new password"), "short");

    await userEvent.click(screen.getByRole("button", { name: /CHANGE PASSWORD/ }));

    expect(screen.getByText("New password must be at least 6 characters long")).toBeInTheDocument();
  });

  it("validates password confirmation match", async () => {
    mockProfileFetch();
    render(<StudentProfilePage />);
    await waitFor(() => {
      expect(screen.getByText("CHANGE PASSWORD", { selector: "h2" })).toBeInTheDocument();
    });

    await userEvent.type(screen.getByPlaceholderText("Enter current password"), "oldpass");
    await userEvent.type(screen.getByPlaceholderText(/Enter new password/), "newpassword");
    await userEvent.type(screen.getByPlaceholderText("Confirm new password"), "different");

    await userEvent.click(screen.getByRole("button", { name: /CHANGE PASSWORD/ }));

    expect(screen.getByText("New passwords do not match")).toBeInTheDocument();
  });

  it("changes password successfully", async () => {
    mockProfileFetch();
    render(<StudentProfilePage />);
    await waitFor(() => {
      expect(screen.getByText("CHANGE PASSWORD", { selector: "h2" })).toBeInTheDocument();
    });

    await userEvent.type(screen.getByPlaceholderText("Enter current password"), "oldpass");
    await userEvent.type(screen.getByPlaceholderText(/Enter new password/), "newpassword");
    await userEvent.type(screen.getByPlaceholderText("Confirm new password"), "newpassword");

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response);

    await userEvent.click(screen.getByRole("button", { name: /CHANGE PASSWORD/ }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/profile/password",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ currentPassword: "oldpass", newPassword: "newpassword" }),
        })
      );
    });
    expect(screen.getByText("Password changed successfully!")).toBeInTheDocument();
  });
});
