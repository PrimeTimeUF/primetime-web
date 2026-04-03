import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EnrollCourseModal from "./EnrollCourseModal";

global.fetch = vi.fn();

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  onEnrolled: vi.fn(),
};

describe("EnrollCourseModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when closed", () => {
    render(<EnrollCourseModal {...defaultProps} open={false} />);
    expect(screen.queryByText("Enroll in Course")).not.toBeInTheDocument();
  });

  it("renders the modal title when open", () => {
    render(<EnrollCourseModal {...defaultProps} />);
    expect(screen.getByText("Enroll in Course")).toBeInTheDocument();
  });

  it("renders the invitation code input", () => {
    render(<EnrollCourseModal {...defaultProps} />);
    expect(screen.getByLabelText("Invitation Code")).toBeInTheDocument();
  });

  it("renders Cancel and Join Course buttons", () => {
    render(<EnrollCourseModal {...defaultProps} />);
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "JOIN COURSE" })).toBeInTheDocument();
  });

  it("shows error when invitation code is empty", async () => {
    render(<EnrollCourseModal {...defaultProps} />);
    // Use fireEvent.submit to bypass HTML5 required validation
    const form = document.querySelector("form")!;
    fireEvent.submit(form);
    await waitFor(() => {
      expect(screen.getByText("Please enter an invitation code.")).toBeInTheDocument();
    });
  });

  it("shows error when invitation code is too short (< 6 chars)", async () => {
    render(<EnrollCourseModal {...defaultProps} />);
    await userEvent.type(screen.getByLabelText("Invitation Code"), "ABC");
    await userEvent.click(screen.getByRole("button", { name: "JOIN COURSE" }));
    await waitFor(() => {
      expect(screen.getByText("Invitation code must be at least 6 characters.")).toBeInTheDocument();
    });
  });

  it("uppercases input as user types", async () => {
    render(<EnrollCourseModal {...defaultProps} />);
    await userEvent.type(screen.getByLabelText("Invitation Code"), "abcdef");
    expect(screen.getByLabelText("Invitation Code")).toHaveValue("ABCDEF");
  });

  it("calls fetch with correct data on valid submission", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ enrollment: { id: "1" }, course: { title: "Psych 101" } }),
    } as Response);

    render(<EnrollCourseModal {...defaultProps} />);
    await userEvent.type(screen.getByLabelText("Invitation Code"), "ABCDEF");
    await userEvent.click(screen.getByRole("button", { name: "JOIN COURSE" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/enrollments", expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ invitationCode: "ABCDEF" }),
      }));
    });
  });

  it("calls onEnrolled and closes modal on success", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ enrollment: { id: "1" }, course: { title: "Psych 101" } }),
    } as Response);

    render(<EnrollCourseModal {...defaultProps} />);
    await userEvent.type(screen.getByLabelText("Invitation Code"), "ABCDEF");
    await userEvent.click(screen.getByRole("button", { name: "JOIN COURSE" }));

    await waitFor(() => {
      expect(defaultProps.onEnrolled).toHaveBeenCalled();
      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("shows API error when enrollment fails", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Invalid invitation code. Please check with your teacher." }),
    } as Response);

    render(<EnrollCourseModal {...defaultProps} />);
    await userEvent.type(screen.getByLabelText("Invitation Code"), "BADCOD");
    await userEvent.click(screen.getByRole("button", { name: "JOIN COURSE" }));

    await waitFor(() => {
      expect(screen.getByText("Invalid invitation code. Please check with your teacher.")).toBeInTheDocument();
    });
  });

  it("shows already-enrolled error", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "You are already enrolled in this course." }),
    } as Response);

    render(<EnrollCourseModal {...defaultProps} />);
    await userEvent.type(screen.getByLabelText("Invitation Code"), "ABCDEF");
    await userEvent.click(screen.getByRole("button", { name: "JOIN COURSE" }));

    await waitFor(() => {
      expect(screen.getByText("You are already enrolled in this course.")).toBeInTheDocument();
    });
  });

  it("shows generic error on network failure", async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error("Network error"));

    render(<EnrollCourseModal {...defaultProps} />);
    await userEvent.type(screen.getByLabelText("Invitation Code"), "ABCDEF");
    await userEvent.click(screen.getByRole("button", { name: "JOIN COURSE" }));

    await waitFor(() => {
      expect(screen.getByText("Something went wrong. Please try again.")).toBeInTheDocument();
    });
  });

  it("shows loading state while submitting", async () => {
    vi.mocked(global.fetch).mockImplementation(() => new Promise(() => {}));

    render(<EnrollCourseModal {...defaultProps} />);
    await userEvent.type(screen.getByLabelText("Invitation Code"), "ABCDEF");
    await userEvent.click(screen.getByRole("button", { name: "JOIN COURSE" }));

    expect(screen.getByText("LOADING...")).toBeInTheDocument();
  });

  it("resets form when modal is closed and reopened", async () => {
    const { rerender } = render(<EnrollCourseModal {...defaultProps} />);
    await userEvent.type(screen.getByLabelText("Invitation Code"), "ABCDEF");

    rerender(<EnrollCourseModal {...defaultProps} open={false} />);
    rerender(<EnrollCourseModal {...defaultProps} open={true} />);

    expect(screen.getByLabelText("Invitation Code")).toHaveValue("");
  });
});
