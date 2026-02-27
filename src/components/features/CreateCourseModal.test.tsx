import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateCourseModal from "./CreateCourseModal";

global.fetch = vi.fn();

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  onCourseCreated: vi.fn(),
};

describe("CreateCourseModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when closed", () => {
    render(<CreateCourseModal {...defaultProps} open={false} />);
    expect(screen.queryByText("Create Course")).not.toBeInTheDocument();
  });

  it("renders the modal title when open", () => {
    render(<CreateCourseModal {...defaultProps} />);
    // getByRole dialog title (heading level 2 from Radix Dialog.Title renders as h2)
    // The text "Create Course" appears as modal title
    expect(screen.getAllByText("Create Course").length).toBeGreaterThanOrEqual(1);
  });

  it("renders all form fields", () => {
    render(<CreateCourseModal {...defaultProps} />);
    expect(screen.getByLabelText("Course Title")).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
    expect(screen.getByLabelText("Course Code")).toBeInTheDocument();
    expect(screen.getByLabelText("Semester")).toBeInTheDocument();
  });

  it("renders Cancel and Create Course buttons", () => {
    render(<CreateCourseModal {...defaultProps} />);
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create Course" })).toBeInTheDocument();
  });

  it("shows validation error when required fields are missing", async () => {
    render(<CreateCourseModal {...defaultProps} />);
    // Use fireEvent.submit to bypass HTML5 required validation and trigger handleSubmit
    const form = document.querySelector("form")!;
    fireEvent.submit(form);
    await waitFor(() => {
      expect(screen.getByText("Title, course code, and semester are required.")).toBeInTheDocument();
    });
  });

  it("shows validation error when only title is missing", async () => {
    render(<CreateCourseModal {...defaultProps} />);
    await userEvent.type(screen.getByLabelText("Course Code"), "PSY101");
    await userEvent.type(screen.getByLabelText("Semester"), "Fall 2026");
    const form = document.querySelector("form")!;
    fireEvent.submit(form);
    await waitFor(() => {
      expect(screen.getByText("Title, course code, and semester are required.")).toBeInTheDocument();
    });
  });

  it("calls fetch with correct data on valid submission", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ course: { id: "1", title: "Psych 101" } }),
    } as Response);

    render(<CreateCourseModal {...defaultProps} />);
    await userEvent.type(screen.getByLabelText("Course Title"), "Introduction to Psychology");
    await userEvent.type(screen.getByLabelText("Course Code"), "PSY 101");
    await userEvent.type(screen.getByLabelText("Semester"), "Fall 2026");
    await userEvent.click(screen.getByRole("button", { name: "Create Course" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/courses", expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          title: "Introduction to Psychology",
          description: undefined,
          courseCode: "PSY 101",
          semester: "Fall 2026",
        }),
      }));
    });
  });

  it("calls onCourseCreated and closes modal on success", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ course: { id: "1" } }),
    } as Response);

    render(<CreateCourseModal {...defaultProps} />);
    await userEvent.type(screen.getByLabelText("Course Title"), "Psych 101");
    await userEvent.type(screen.getByLabelText("Course Code"), "PSY 101");
    await userEvent.type(screen.getByLabelText("Semester"), "Fall 2026");
    await userEvent.click(screen.getByRole("button", { name: "Create Course" }));

    await waitFor(() => {
      expect(defaultProps.onCourseCreated).toHaveBeenCalled();
      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("shows API error when course creation fails", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Course code already exists" }),
    } as Response);

    render(<CreateCourseModal {...defaultProps} />);
    await userEvent.type(screen.getByLabelText("Course Title"), "Psych 101");
    await userEvent.type(screen.getByLabelText("Course Code"), "PSY 101");
    await userEvent.type(screen.getByLabelText("Semester"), "Fall 2026");
    await userEvent.click(screen.getByRole("button", { name: "Create Course" }));

    await waitFor(() => {
      expect(screen.getByText("Course code already exists")).toBeInTheDocument();
    });
  });

  it("shows generic error on network failure", async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error("Network error"));

    render(<CreateCourseModal {...defaultProps} />);
    await userEvent.type(screen.getByLabelText("Course Title"), "Psych 101");
    await userEvent.type(screen.getByLabelText("Course Code"), "PSY 101");
    await userEvent.type(screen.getByLabelText("Semester"), "Fall 2026");
    await userEvent.click(screen.getByRole("button", { name: "Create Course" }));

    await waitFor(() => {
      expect(screen.getByText("Something went wrong. Please try again.")).toBeInTheDocument();
    });
  });

  it("shows loading state while submitting", async () => {
    vi.mocked(global.fetch).mockImplementation(() => new Promise(() => {}));

    render(<CreateCourseModal {...defaultProps} />);
    await userEvent.type(screen.getByLabelText("Course Title"), "Psych 101");
    await userEvent.type(screen.getByLabelText("Course Code"), "PSY 101");
    await userEvent.type(screen.getByLabelText("Semester"), "Fall 2026");
    await userEvent.click(screen.getByRole("button", { name: "Create Course" }));

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("includes description in fetch body when provided", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ course: { id: "1" } }),
    } as Response);

    render(<CreateCourseModal {...defaultProps} />);
    await userEvent.type(screen.getByLabelText("Course Title"), "Psych 101");
    await userEvent.type(screen.getByLabelText("Description"), "A course about psychology");
    await userEvent.type(screen.getByLabelText("Course Code"), "PSY 101");
    await userEvent.type(screen.getByLabelText("Semester"), "Fall 2026");
    await userEvent.click(screen.getByRole("button", { name: "Create Course" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/courses", expect.objectContaining({
        body: JSON.stringify({
          title: "Psych 101",
          description: "A course about psychology",
          courseCode: "PSY 101",
          semester: "Fall 2026",
        }),
      }));
    });
  });

  it("shows validation error when title is whitespace only", async () => {
    render(<CreateCourseModal {...defaultProps} />);
    await userEvent.type(screen.getByLabelText("Course Title"), "   ");
    await userEvent.type(screen.getByLabelText("Course Code"), "PSY 101");
    await userEvent.type(screen.getByLabelText("Semester"), "Fall 2026");
    const form = document.querySelector("form")!;
    fireEvent.submit(form);
    await waitFor(() => {
      expect(screen.getByText("Title, course code, and semester are required.")).toBeInTheDocument();
    });
  });

  it("resets form fields when modal is closed and reopened", async () => {
    const { rerender } = render(<CreateCourseModal {...defaultProps} />);
    await userEvent.type(screen.getByLabelText("Course Title"), "Some Course");

    // Close the modal
    rerender(<CreateCourseModal {...defaultProps} open={false} />);
    // Reopen the modal
    rerender(<CreateCourseModal {...defaultProps} open={true} />);

    expect(screen.getByLabelText("Course Title")).toHaveValue("");
  });
});
