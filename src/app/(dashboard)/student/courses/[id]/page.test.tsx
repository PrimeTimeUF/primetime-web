import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import StudentCourseDetailPage from "./page";

global.fetch = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "course-1" }),
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const mockCourse = {
  id: "course-1",
  title: "Biology 101",
  description: "Intro to biology",
  course_code: "BIO101",
  semester: "Fall 2025",
  teacher_name: "Dr. Smith",
  teacher_profile_image_url: null,
};

const mockAssignments = [
  {
    id: "a1",
    session_id: "s1",
    course_id: "course-1",
    assigned_by: "teacher-1",
    due_date: "2027-12-01",
    assigned_at: "2025-06-01T00:00:00Z",
    is_published: true,
    session: { id: "s1", title: "Session 1", lecture_name: "Lecture 1", duration: 15, status: "completed" as const },
    completion: null,
  },
  {
    id: "a2",
    session_id: "s2",
    course_id: "course-1",
    assigned_by: "teacher-1",
    due_date: "2025-06-10",
    assigned_at: "2025-06-01T00:00:00Z",
    is_published: true,
    session: { id: "s2", title: "Session 2", lecture_name: "Lecture 2", duration: 15, status: "completed" as const },
    completion: { score: 4, total_questions: 5, completed_at: "2025-06-09T00:00:00Z" },
  },
];

const mockProgress = {
  total_assigned: 2,
  completed_count: 1,
  completion_percentage: 50,
  average_score: 80,
};

function setupDefaultMocks() {
  // Course fetch
  vi.mocked(global.fetch).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ course: mockCourse }),
  } as Response);
  // Assignments fetch
  vi.mocked(global.fetch).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ assignments: mockAssignments, progress: mockProgress }),
  } as Response);
}

describe("StudentCourseDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state initially", () => {
    vi.mocked(global.fetch).mockImplementation(() => new Promise(() => {}));
    render(<StudentCourseDetailPage />);
    expect(screen.getByText("Loading course...")).toBeInTheDocument();
  });

  it("shows error state with back link", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Not found" }),
    } as Response);
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ assignments: [] }),
    } as Response);
    render(<StudentCourseDetailPage />);
    await waitFor(() => {
      expect(screen.getByText("Not found")).toBeInTheDocument();
    });
    expect(screen.getByText("Back to Dashboard")).toBeInTheDocument();
  });

  it("renders course header with title and details", async () => {
    setupDefaultMocks();
    render(<StudentCourseDetailPage />);
    await waitFor(() => {
      expect(screen.getByText("Biology 101")).toBeInTheDocument();
    });
    expect(screen.getByText("BIO101")).toBeInTheDocument();
    expect(screen.getByText("Fall 2025")).toBeInTheDocument();
  });

  it("renders course description", async () => {
    setupDefaultMocks();
    render(<StudentCourseDetailPage />);
    await waitFor(() => {
      expect(screen.getByText("Intro to biology")).toBeInTheDocument();
    });
  });

  it("renders teacher name with initials", async () => {
    setupDefaultMocks();
    render(<StudentCourseDetailPage />);
    await waitFor(() => {
      expect(screen.getByText("Dr. Smith")).toBeInTheDocument();
    });
    expect(screen.getByText("DS")).toBeInTheDocument();
  });

  it("renders assignments list", async () => {
    setupDefaultMocks();
    render(<StudentCourseDetailPage />);
    await waitFor(() => {
      expect(screen.getByText("Session 1")).toBeInTheDocument();
    });
    expect(screen.getByText("Session 2")).toBeInTheDocument();
  });

  it("shows Completed badge for completed assignments", async () => {
    setupDefaultMocks();
    render(<StudentCourseDetailPage />);
    await waitFor(() => {
      expect(screen.getByText("Completed", { selector: "span" })).toBeInTheDocument();
    });
  });

  it("shows filter buttons", async () => {
    setupDefaultMocks();
    render(<StudentCourseDetailPage />);
    await waitFor(() => {
      expect(screen.getByText("All", { selector: "button" })).toBeInTheDocument();
    });
    expect(screen.getByText("Upcoming", { selector: "button" })).toBeInTheDocument();
    expect(screen.getByText("Completed", { selector: "button" })).toBeInTheDocument();
  });

  it("filters to completed assignments", async () => {
    setupDefaultMocks();
    render(<StudentCourseDetailPage />);
    await waitFor(() => {
      expect(screen.getByText("Session 1")).toBeInTheDocument();
    });

    // Find the Completed filter button (not the badge)
    const filterButtons = screen.getAllByText("Completed");
    const filterBtn = filterButtons.find((el) => el.tagName === "BUTTON")!;
    await userEvent.click(filterBtn);

    // Session 2 is completed, Session 1 is not
    expect(screen.getByText("Session 2")).toBeInTheDocument();
    expect(screen.queryByText("Session 1")).not.toBeInTheDocument();
  });

  it("filters to upcoming assignments", async () => {
    setupDefaultMocks();
    render(<StudentCourseDetailPage />);
    await waitFor(() => {
      expect(screen.getByText("Session 1")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText("Upcoming", { selector: "button" }));

    expect(screen.getByText("Session 1")).toBeInTheDocument();
    expect(screen.queryByText("Session 2")).not.toBeInTheDocument();
  });

  it("shows empty state message for filtered results", async () => {
    // Only one completed assignment, no upcoming
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ course: mockCourse }),
    } as Response);
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        assignments: [mockAssignments[1]], // only the completed one
        progress: mockProgress,
      }),
    } as Response);
    render(<StudentCourseDetailPage />);
    await waitFor(() => {
      expect(screen.getByText("Session 2")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText("Upcoming"));
    expect(screen.getByText("No upcoming sessions")).toBeInTheDocument();
  });

  it("renders progress sidebar", async () => {
    setupDefaultMocks();
    render(<StudentCourseDetailPage />);
    await waitFor(() => {
      expect(screen.getByText("Your Progress")).toBeInTheDocument();
    });
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("1/2")).toBeInTheDocument();
    expect(screen.getByText("80%")).toBeInTheDocument();
  });

  it("fetches both course and assignments", async () => {
    setupDefaultMocks();
    render(<StudentCourseDetailPage />);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/courses/course-1");
      expect(global.fetch).toHaveBeenCalledWith("/api/courses/course-1/assignments");
    });
  });
});
