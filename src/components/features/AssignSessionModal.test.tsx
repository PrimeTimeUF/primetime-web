import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AssignSessionModal from "./AssignSessionModal";
import type { PrimingSessionListItem } from "@/lib/types/priming-session";

global.fetch = vi.fn();

function makeSession(overrides: Partial<PrimingSessionListItem> = {}): PrimingSessionListItem {
  return {
    id: "session-1",
    material_id: "mat-1",
    course_id: "course-1",
    title: "Test Session",
    status: "completed",
    error_message: null,
    created_at: "2025-06-01T00:00:00Z",
    completed_at: "2025-06-01T01:00:00Z",
    lecture_name: "Lecture 1",
    duration: 15,
    material: { file_name: "notes.pdf" },
    ...overrides,
  };
}

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  courseId: "course-123",
  sessions: [
    makeSession({ id: "s1", title: "Session A", status: "completed" }),
    makeSession({ id: "s2", title: "Session B", status: "completed" }),
    makeSession({ id: "s3", title: "Session C", status: "generating" }),
  ],
  assignedSessionIds: new Set<string>(),
  onAssigned: vi.fn(),
};

describe("AssignSessionModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render content when closed", () => {
    render(<AssignSessionModal {...defaultProps} open={false} />);
    expect(screen.queryByText("Assign Session to Students")).not.toBeInTheDocument();
  });

  it("renders modal title and description when open", () => {
    render(<AssignSessionModal {...defaultProps} />);
    expect(screen.getByText("Assign Session to Students")).toBeInTheDocument();
    expect(screen.getByText(/Select a completed priming session/)).toBeInTheDocument();
  });

  it("only shows completed and unassigned sessions", () => {
    render(<AssignSessionModal {...defaultProps} />);
    const options = screen.getAllByRole("option");
    // Placeholder + Session A + Session B (Session C is "generating")
    expect(options).toHaveLength(3);
    expect(screen.getByText(/Session A/)).toBeInTheDocument();
    expect(screen.getByText(/Session B/)).toBeInTheDocument();
  });

  it("excludes already assigned sessions", () => {
    render(
      <AssignSessionModal
        {...defaultProps}
        assignedSessionIds={new Set(["s1"])}
      />
    );
    const options = screen.getAllByRole("option");
    // Placeholder + Session B only
    expect(options).toHaveLength(2);
    expect(screen.queryByText(/Session A/)).not.toBeInTheDocument();
  });

  it("shows empty state when no available sessions", () => {
    render(
      <AssignSessionModal
        {...defaultProps}
        sessions={[makeSession({ id: "s1", status: "generating" })]}
      />
    );
    expect(screen.getByText(/No unassigned completed sessions available/)).toBeInTheDocument();
  });

  it("shows validation error when submitting without session", async () => {
    render(<AssignSessionModal {...defaultProps} />);
    // The button should be disabled since no session/date selected
    expect(screen.getByRole("button", { name: "ASSIGN SESSION" })).toBeDisabled();
  });

  it("submits with correct payload", async () => {
    render(<AssignSessionModal {...defaultProps} />);

    // Select session
    const select = screen.getByRole("combobox");
    await userEvent.selectOptions(select, "s1");

    // Set due date
    const dateInput = screen.getByDisplayValue("");
    await userEvent.type(dateInput, "2026-12-25");

    // Mock response
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response);

    // Submit
    await userEvent.click(screen.getByText("ASSIGN SESSION"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/courses/course-123/assignments",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ session_id: "s1", due_date: "2026-12-25" }),
        })
      );
    });
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    expect(defaultProps.onAssigned).toHaveBeenCalled();
  });

  it("shows 'Assigning...' during submission", async () => {
    render(<AssignSessionModal {...defaultProps} />);

    const select = screen.getByRole("combobox");
    await userEvent.selectOptions(select, "s1");

    const dateInput = screen.getByDisplayValue("");
    await userEvent.type(dateInput, "2026-12-25");

    vi.mocked(global.fetch).mockImplementation(() => new Promise(() => {}));
    await userEvent.click(screen.getByText("ASSIGN SESSION"));

    expect(screen.getByText("ASSIGNING...")).toBeInTheDocument();
  });

  it("displays API error message", async () => {
    render(<AssignSessionModal {...defaultProps} />);

    const select = screen.getByRole("combobox");
    await userEvent.selectOptions(select, "s1");

    const dateInput = screen.getByDisplayValue("");
    await userEvent.type(dateInput, "2026-12-25");

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Already assigned" }),
    } as Response);

    await userEvent.click(screen.getByText("ASSIGN SESSION"));

    await waitFor(() => {
      expect(screen.getByText("Already assigned")).toBeInTheDocument();
    });
  });

  it("disables Assign button when no sessions are available", () => {
    render(
      <AssignSessionModal
        {...defaultProps}
        sessions={[makeSession({ id: "s1", status: "generating" })]}
      />
    );
    expect(screen.getByRole("button", { name: "ASSIGN SESSION" })).toBeDisabled();
  });

  it("renders due date input with min date set to tomorrow", () => {
    render(<AssignSessionModal {...defaultProps} />);
    const dateInput = document.querySelector("input[type='date']") as HTMLInputElement;
    expect(dateInput).toBeTruthy();
    // Min date should be tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const expected = tomorrow.toISOString().split("T")[0];
    expect(dateInput.min).toBe(expected);
  });
});
