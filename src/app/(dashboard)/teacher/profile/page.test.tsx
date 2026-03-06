import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TeacherProfilePage from "./page";

global.fetch = vi.fn();

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockProfile = {
  id: "user-2",
  email: "teacher@test.com",
  role: "teacher",
  full_name: "Dr. Smith",
  profile_image_url: null,
  created_at: "2024-09-01T00:00:00Z",
};

function mockProfileFetch(profile = mockProfile) {
  vi.mocked(global.fetch).mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => ({ profile }),
  } as Response);
}

describe("TeacherProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state initially", () => {
    vi.mocked(global.fetch).mockImplementation(() => new Promise(() => {}));
    render(<TeacherProfilePage />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("redirects to login on 401", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({}),
    } as Response);
    render(<TeacherProfilePage />);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });

  it("shows error state on fetch failure", async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error("fail"));
    render(<TeacherProfilePage />);
    await waitFor(() => {
      expect(screen.getByText("Error loading profile")).toBeInTheDocument();
    });
  });

  it("renders profile data after loading", async () => {
    mockProfileFetch();
    render(<TeacherProfilePage />);
    await waitFor(() => {
      expect(screen.getByText("Profile & Settings")).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue("teacher@test.com")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Dr. Smith")).toBeInTheDocument();
    expect(screen.getByText("teacher")).toBeInTheDocument();
  });

  it("shows initials DS for Dr. Smith", async () => {
    mockProfileFetch();
    render(<TeacherProfilePage />);
    await waitFor(() => {
      expect(screen.getByText("DS")).toBeInTheDocument();
    });
  });

  it("saves profile successfully", async () => {
    mockProfileFetch();
    render(<TeacherProfilePage />);
    await waitFor(() => {
      expect(screen.getByDisplayValue("Dr. Smith")).toBeInTheDocument();
    });

    const nameInput = screen.getByDisplayValue("Dr. Smith");
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Dr. Jane Smith");

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ profile: { ...mockProfile, full_name: "Dr. Jane Smith" } }),
    } as Response);

    await userEvent.click(screen.getByText("Save Changes"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/profile",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ full_name: "Dr. Jane Smith" }),
        })
      );
    });
    expect(screen.getByText("Profile updated successfully!")).toBeInTheDocument();
  });

  it("changes password successfully", async () => {
    mockProfileFetch();
    render(<TeacherProfilePage />);
    await waitFor(() => {
      expect(screen.getByText("Change Password", { selector: "h2" })).toBeInTheDocument();
    });

    await userEvent.type(screen.getByPlaceholderText("Enter current password"), "oldpass");
    await userEvent.type(screen.getByPlaceholderText(/Enter new password/), "newpassword");
    await userEvent.type(screen.getByPlaceholderText("Confirm new password"), "newpassword");

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response);

    await userEvent.click(screen.getByText("Change Password", { selector: "button" }));

    await waitFor(() => {
      expect(screen.getByText("Password changed successfully!")).toBeInTheDocument();
    });
  });

  it("validates password fields", async () => {
    mockProfileFetch();
    render(<TeacherProfilePage />);
    await waitFor(() => {
      expect(screen.getByText("Change Password", { selector: "h2" })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText("Change Password", { selector: "button" }));
    expect(screen.getByText("All password fields are required")).toBeInTheDocument();
  });
});
