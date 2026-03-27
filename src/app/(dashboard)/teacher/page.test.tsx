import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TeacherDashboardPage from "./page";
import { DashboardThemeContext } from "./dashboard-theme-context";

global.fetch = vi.fn();

vi.mock("@/components", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    CreateCourseModal: ({
      open,
      onCourseCreated,
    }: {
      open: boolean;
      onOpenChange: (v: boolean) => void;
      onCourseCreated: () => void;
    }) =>
      open ? (
        <div data-testid="create-course-modal">
          <button onClick={onCourseCreated}>Simulate Course Created</button>
        </div>
      ) : null,
  };
});

vi.mock("@/components/ui/dashboard-primitives", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    BrutalistCard: ({ children, className, ...rest }: Record<string, unknown>) => (
      <div data-testid="brutalist-card" className={className as string} {...rest}>
        {children as React.ReactNode}
      </div>
    ),
    BrutalistButton: ({
      children,
      onClick,
      className,
    }: {
      children: React.ReactNode;
      onClick?: () => void;
      className?: string;
      isDark?: boolean;
      iconBefore?: React.ReactNode;
    }) => (
      <button onClick={onClick} className={className}>
        {children}
      </button>
    ),
    SectionLabel: () => <div data-testid="section-label" />,
  };
});

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <DashboardThemeContext.Provider value={{ isDark: true, toggle: () => {} }}>
      {ui}
    </DashboardThemeContext.Provider>
  );
}

const mockCourses = [
  {
    id: "c1",
    title: "Intro to Psychology",
    description: "A course about psychology",
    course_code: "PSY 101",
    semester: "Fall 2026",
    invitation_code: "ABCD1234",
    created_at: "2026-01-01",
  },
];

describe("TeacherDashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state while fetching courses", () => {
    vi.mocked(global.fetch).mockImplementation(() => new Promise(() => {}));
    renderWithTheme(<TeacherDashboardPage />);
    expect(screen.getByText("LOADING COURSES...")).toBeInTheDocument();
  });

  it("fetches courses from /api/courses on mount", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ courses: [] }),
    } as Response);

    renderWithTheme(<TeacherDashboardPage />);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/courses");
    });
  });

  it("displays courses when fetch succeeds", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ courses: mockCourses }),
    } as Response);

    renderWithTheme(<TeacherDashboardPage />);
    await waitFor(() => {
      expect(screen.getByText("INTRO TO PSYCHOLOGY")).toBeInTheDocument();
      expect(screen.getByText("PSY 101")).toBeInTheDocument();
      expect(screen.getByText("Fall 2026")).toBeInTheDocument();
      expect(screen.getByText("ABCD1234")).toBeInTheDocument();
    });
  });

  it("shows empty state when no courses exist", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ courses: [] }),
    } as Response);

    renderWithTheme(<TeacherDashboardPage />);
    await waitFor(() => {
      expect(screen.getByText("NO COURSES YET")).toBeInTheDocument();
    });
  });

  it("shows error message when fetch returns an error", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Unauthorized" }),
    } as Response);

    renderWithTheme(<TeacherDashboardPage />);
    await waitFor(() => {
      expect(screen.getByText("Unauthorized")).toBeInTheDocument();
    });
  });

  it("shows generic error on network failure", async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error("Network error"));

    renderWithTheme(<TeacherDashboardPage />);
    await waitFor(() => {
      expect(
        screen.getByText("Something went wrong. Please try again.")
      ).toBeInTheDocument();
    });
  });

  it("opens CreateCourseModal when CREATE COURSE button is clicked", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ courses: [] }),
    } as Response);

    renderWithTheme(<TeacherDashboardPage />);
    await waitFor(() =>
      expect(screen.getByText("NO COURSES YET")).toBeInTheDocument()
    );

    await userEvent.click(screen.getByRole("button", { name: "CREATE COURSE" }));
    expect(screen.getByTestId("create-course-modal")).toBeInTheDocument();
  });

  it("opens CreateCourseModal when empty state button is clicked", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ courses: [] }),
    } as Response);

    renderWithTheme(<TeacherDashboardPage />);
    await waitFor(() =>
      expect(screen.getByText("NO COURSES YET")).toBeInTheDocument()
    );

    await userEvent.click(
      screen.getByRole("button", { name: "CREATE YOUR FIRST COURSE" })
    );
    expect(screen.getByTestId("create-course-modal")).toBeInTheDocument();
  });

  it("refetches courses after onCourseCreated fires", async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ courses: [] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ courses: mockCourses }),
      } as Response);

    renderWithTheme(<TeacherDashboardPage />);
    await waitFor(() =>
      expect(screen.getByText("NO COURSES YET")).toBeInTheDocument()
    );

    await userEvent.click(screen.getByRole("button", { name: "CREATE COURSE" }));
    await userEvent.click(
      screen.getByRole("button", { name: "Simulate Course Created" })
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(screen.getByText("INTRO TO PSYCHOLOGY")).toBeInTheDocument();
    });
  });
});
