import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CreateSessionModal from "./CreateSessionModal";

global.fetch = vi.fn();

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  courseId: "course-123",
  onCreated: vi.fn(),
};

function mockFetchMaterials(materials: { lecture_name: string | null }[] = []) {
  vi.mocked(global.fetch).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ materials }),
  } as Response);
}

describe("CreateSessionModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render content when closed", () => {
    mockFetchMaterials();
    render(<CreateSessionModal {...defaultProps} open={false} />);
    expect(screen.queryByText("Create Priming Session")).not.toBeInTheDocument();
  });

  it("renders modal title and description when open", async () => {
    mockFetchMaterials();
    render(<CreateSessionModal {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText("Create Priming Session")).toBeInTheDocument();
    });
    expect(screen.getByText(/Select a lecture group and session duration/)).toBeInTheDocument();
  });

  it("fetches lecture names on open", async () => {
    mockFetchMaterials([{ lecture_name: "Lecture 1" }, { lecture_name: "Lecture 2" }]);
    render(<CreateSessionModal {...defaultProps} />);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/courses/course-123/materials");
    });
  });

  it("shows loading state while fetching lectures", () => {
    vi.mocked(global.fetch).mockImplementation(() => new Promise(() => {}));
    render(<CreateSessionModal {...defaultProps} />);
    expect(screen.getByText("Loading lectures...")).toBeInTheDocument();
  });

  it("shows empty state when no lectures found", async () => {
    mockFetchMaterials([]);
    render(<CreateSessionModal {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText(/No lecture groups found/)).toBeInTheDocument();
    });
  });

  it("populates select with deduplicated lecture names", async () => {
    mockFetchMaterials([
      { lecture_name: "Lecture 1" },
      { lecture_name: "Lecture 1" },
      { lecture_name: "Lecture 2" },
      { lecture_name: null },
    ]);
    render(<CreateSessionModal {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText("Lecture 1")).toBeInTheDocument();
    });
    expect(screen.getByText("Lecture 2")).toBeInTheDocument();
    const options = screen.getAllByRole("option");
    // "Select a lecture..." + "Lecture 1" + "Lecture 2"
    expect(options).toHaveLength(3);
  });

  it("renders duration option buttons", async () => {
    mockFetchMaterials([{ lecture_name: "L1" }]);
    render(<CreateSessionModal {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText("10 min")).toBeInTheDocument();
    });
    expect(screen.getByText("15 min")).toBeInTheDocument();
    expect(screen.getByText("30 min")).toBeInTheDocument();
  });

  it("highlights 15 min duration by default", async () => {
    mockFetchMaterials([{ lecture_name: "L1" }]);
    render(<CreateSessionModal {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText("15 min")).toBeInTheDocument();
    });
    const btn15 = screen.getByText("15 min").closest("button")!;
    expect(btn15.className).toContain("border-white");
  });

  it("submits with correct payload on success", async () => {
    mockFetchMaterials([{ lecture_name: "Lecture A" }]);
    render(<CreateSessionModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Lecture A")).toBeInTheDocument();
    });

    // Select the lecture
    const select = screen.getByRole("combobox");
    await userEvent.selectOptions(select, "Lecture A");

    // Click 30 min duration
    await userEvent.click(screen.getByText("30 min"));

    // Mock the submit response
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response);

    // Click Create Session
    await userEvent.click(screen.getByText("CREATE SESSION"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/courses/course-123/sessions/generate",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ lectureName: "Lecture A", duration: 30 }),
        })
      );
    });
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    expect(defaultProps.onCreated).toHaveBeenCalled();
  });

  it("shows 'Creating...' during submission", async () => {
    mockFetchMaterials([{ lecture_name: "L1" }]);
    render(<CreateSessionModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("L1")).toBeInTheDocument();
    });

    const select = screen.getByRole("combobox");
    await userEvent.selectOptions(select, "L1");

    vi.mocked(global.fetch).mockImplementation(() => new Promise(() => {}));
    await userEvent.click(screen.getByText("CREATE SESSION"));

    expect(screen.getByText("CREATING...")).toBeInTheDocument();
  });

  it("displays API error message", async () => {
    mockFetchMaterials([{ lecture_name: "L1" }]);
    render(<CreateSessionModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("L1")).toBeInTheDocument();
    });

    const select = screen.getByRole("combobox");
    await userEvent.selectOptions(select, "L1");

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Material not found" }),
    } as Response);

    await userEvent.click(screen.getByText("CREATE SESSION"));

    await waitFor(() => {
      expect(screen.getByText("Material not found")).toBeInTheDocument();
    });
  });

  it("displays fallback error on network failure", async () => {
    mockFetchMaterials([{ lecture_name: "L1" }]);
    render(<CreateSessionModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("L1")).toBeInTheDocument();
    });

    const select = screen.getByRole("combobox");
    await userEvent.selectOptions(select, "L1");

    vi.mocked(global.fetch).mockRejectedValueOnce(new Error("Network error"));
    await userEvent.click(screen.getByText("CREATE SESSION"));

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  it("disables Create Session button when no lectures available", async () => {
    mockFetchMaterials([]);
    render(<CreateSessionModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/No lecture groups found/)).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "CREATE SESSION" })).toBeDisabled();
  });
});
