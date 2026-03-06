import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TeacherCourseDetailPage from "./page";

global.fetch = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "course-1" }),
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/components", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    CreateSessionModal: ({ open }: { open: boolean }) =>
      open ? <div data-testid="create-session-modal">Create Modal</div> : null,
    AssignSessionModal: ({ open }: { open: boolean }) =>
      open ? <div data-testid="assign-session-modal">Assign Modal</div> : null,
  };
});

const mockCourse = {
  id: "course-1",
  title: "Biology 101",
  description: "Intro to biology",
  course_code: "BIO101",
  semester: "Fall 2025",
  invitation_code: "ABC123",
  created_at: "2025-01-01T00:00:00Z",
};

const mockSessions = [
  {
    id: "s1",
    material_id: "mat-1",
    course_id: "course-1",
    title: "Session Alpha",
    status: "completed" as const,
    error_message: null,
    created_at: "2025-06-01T10:00:00Z",
    completed_at: "2025-06-01T11:00:00Z",
    lecture_name: "Lecture 1",
    duration: 15 as const,
    material: { file_name: "notes.pdf" },
  },
  {
    id: "s2",
    material_id: "mat-2",
    course_id: "course-1",
    title: null,
    status: "generating" as const,
    error_message: null,
    created_at: "2025-06-02T10:00:00Z",
    completed_at: null,
    lecture_name: "Lecture 2",
    duration: 30 as const,
    material: { file_name: "slides.pdf" },
  },
];

function setupDefaultMocks() {
  // Course fetch
  vi.mocked(global.fetch).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ course: mockCourse }),
  } as Response);
  // Sessions fetch
  vi.mocked(global.fetch).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ sessions: mockSessions }),
  } as Response);
  // Student count fetch
  vi.mocked(global.fetch).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ count: 25 }),
  } as Response);
  // Materials fetch (MaterialsTab auto-fetches)
  vi.mocked(global.fetch).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ materials: [] }),
  } as Response);
}

describe("TeacherCourseDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows loading state initially", () => {
    vi.mocked(global.fetch).mockImplementation(() => new Promise(() => {}));
    render(<TeacherCourseDetailPage />);
    expect(screen.getByText("Loading course...")).toBeInTheDocument();
  });

  it("shows error state with back link", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Course not found" }),
    } as Response);
    // Sessions and student count still resolve
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sessions: [] }),
    } as Response);
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ count: 0 }),
    } as Response);
    render(<TeacherCourseDetailPage />);
    await waitFor(() => {
      expect(screen.getByText("Course not found")).toBeInTheDocument();
    });
    expect(screen.getByText("Back to Dashboard")).toBeInTheDocument();
  });

  it("renders course header with title and metadata", async () => {
    setupDefaultMocks();
    render(<TeacherCourseDetailPage />);
    await waitFor(() => {
      expect(screen.getByText("Biology 101")).toBeInTheDocument();
    });
    expect(screen.getByText("BIO101")).toBeInTheDocument();
    expect(screen.getByText("Fall 2025")).toBeInTheDocument();
    expect(screen.getByText("25 students")).toBeInTheDocument();
  });

  it("renders tab buttons with counts", async () => {
    setupDefaultMocks();
    render(<TeacherCourseDetailPage />);
    await waitFor(() => {
      expect(screen.getByText("Materials")).toBeInTheDocument();
    });
    expect(screen.getByText("Students")).toBeInTheDocument();
    expect(screen.getByText("Priming Sessions")).toBeInTheDocument();
  });

  it("switches to Students tab", async () => {
    setupDefaultMocks();
    render(<TeacherCourseDetailPage />);
    await waitFor(() => {
      expect(screen.getByText("Students")).toBeInTheDocument();
    });

    // Mock students tab fetch
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ students: [] }),
    } as Response);

    await userEvent.click(screen.getByText("Students"));

    await waitFor(() => {
      expect(screen.getByText("Invitation Code")).toBeInTheDocument();
    });
    expect(screen.getByText("ABC123")).toBeInTheDocument();
  });

  it("switches to Sessions tab", async () => {
    setupDefaultMocks();
    render(<TeacherCourseDetailPage />);
    await waitFor(() => {
      expect(screen.getByText("Priming Sessions")).toBeInTheDocument();
    });

    // Mock assignments fetch for SessionsTab
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ assignments: [] }),
    } as Response);

    await userEvent.click(screen.getByText("Priming Sessions"));

    await waitFor(() => {
      expect(screen.getByText("Create Priming Session")).toBeInTheDocument();
    });
    expect(screen.getByText("Assign Session")).toBeInTheDocument();
  });

  it("fetches course, sessions, and student count on mount", async () => {
    setupDefaultMocks();
    render(<TeacherCourseDetailPage />);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/courses/course-1");
      expect(global.fetch).toHaveBeenCalledWith("/api/courses/course-1/sessions");
      expect(global.fetch).toHaveBeenCalledWith("/api/courses/course-1/students");
    });
  });

  it("shows singular 'student' for count of 1", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ course: mockCourse }),
    } as Response);
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sessions: [] }),
    } as Response);
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ count: 1 }),
    } as Response);
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ materials: [] }),
    } as Response);
    render(<TeacherCourseDetailPage />);
    await waitFor(() => {
      expect(screen.getByText("1 student")).toBeInTheDocument();
    });
  });
});
