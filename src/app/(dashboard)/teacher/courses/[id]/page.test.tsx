import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import TeacherCourseDetailPage from "./page";
import { DashboardThemeContext } from "../../dashboard-theme-context";

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

vi.mock("@/components/ui/dashboard-primitives", () => ({
  BrutalistCard: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="brutalist-card" className={className}>{children}</div>
  ),
  BrutalistButton: ({ children, onClick, disabled, variant, size, iconBefore }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; variant?: string; size?: string; iconBefore?: React.ReactNode }) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant} data-size={size}>{iconBefore}{children}</button>
  ),
  BrutalistTab: ({ label, count, active, onClick }: { isDark: boolean; label: string; count?: number; active: boolean; onClick: () => void }) => (
    <button onClick={onClick} data-active={active}>{label}{count !== undefined && <span>{count}</span>}</button>
  ),
  BrutalistBadge: ({ children, variant, icon }: { children: React.ReactNode; isDark: boolean; variant: string; icon?: React.ReactNode }) => (
    <span data-variant={variant}>{icon}{children}</span>
  ),
  SectionLabel: ({ num, label }: { num: string; label: string; isDark: boolean }) => (
    <div>{num} {label}</div>
  ),
  themeTokens: () => ({
    bg: "",
    text: "",
    textMid: "",
    textDim: "",
    border: "",
    borderMid: "",
    borderFull: "",
  }),
}));

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

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <DashboardThemeContext.Provider value={{ isDark: true, toggle: () => {} }}>
      {ui}
    </DashboardThemeContext.Provider>
  );
}

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
    renderWithTheme(<TeacherCourseDetailPage />);
    expect(screen.getByText("LOADING COURSE...")).toBeInTheDocument();
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
    renderWithTheme(<TeacherCourseDetailPage />);
    await waitFor(() => {
      expect(screen.getByText("Course not found")).toBeInTheDocument();
    });
    expect(screen.getByText("BACK TO DASHBOARD")).toBeInTheDocument();
  });

  it("renders course header with title and metadata", async () => {
    setupDefaultMocks();
    renderWithTheme(<TeacherCourseDetailPage />);
    await waitFor(() => {
      expect(screen.getByText("BIOLOGY 101")).toBeInTheDocument();
    });
    expect(screen.getByText("BIO101")).toBeInTheDocument();
    expect(screen.getByText("Fall 2025")).toBeInTheDocument();
    expect(screen.getByText("25 STUDENTS")).toBeInTheDocument();
  });

  it("renders tab buttons with counts", async () => {
    setupDefaultMocks();
    renderWithTheme(<TeacherCourseDetailPage />);
    await waitFor(() => {
      expect(screen.getByText("MATERIALS")).toBeInTheDocument();
    });
    expect(screen.getByText("STUDENTS")).toBeInTheDocument();
    expect(screen.getByText("SESSIONS")).toBeInTheDocument();
  });

  it("switches to Students tab", async () => {
    setupDefaultMocks();
    renderWithTheme(<TeacherCourseDetailPage />);
    await waitFor(() => {
      expect(screen.getByText("STUDENTS")).toBeInTheDocument();
    });

    // Mock students tab fetch
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ students: [] }),
    } as Response);

    await userEvent.click(screen.getByText("STUDENTS"));

    await waitFor(() => {
      expect(screen.getByText("INVITATION CODE")).toBeInTheDocument();
    });
    expect(screen.getByText("ABC123")).toBeInTheDocument();
  });

  it("switches to Sessions tab", async () => {
    setupDefaultMocks();
    renderWithTheme(<TeacherCourseDetailPage />);
    await waitFor(() => {
      expect(screen.getByText("SESSIONS")).toBeInTheDocument();
    });

    // Mock assignments fetch for SessionsTab
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ assignments: [] }),
    } as Response);

    await userEvent.click(screen.getByText("SESSIONS"));

    await waitFor(() => {
      expect(screen.getByText("CREATE SESSION")).toBeInTheDocument();
    });
    expect(screen.getByText("ASSIGN SESSION")).toBeInTheDocument();
  });

  it("fetches course, sessions, and student count on mount", async () => {
    setupDefaultMocks();
    renderWithTheme(<TeacherCourseDetailPage />);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/courses/course-1");
      expect(global.fetch).toHaveBeenCalledWith("/api/courses/course-1/sessions");
      expect(global.fetch).toHaveBeenCalledWith("/api/courses/course-1/students");
    });
  });

  it("shows singular 'STUDENT' for count of 1", async () => {
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
    renderWithTheme(<TeacherCourseDetailPage />);
    await waitFor(() => {
      expect(screen.getByText("1 STUDENT")).toBeInTheDocument();
    });
  });
});
