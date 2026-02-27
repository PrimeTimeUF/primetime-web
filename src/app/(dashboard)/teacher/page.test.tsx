import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TeacherDashboardPage from "./page";

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
    render(<TeacherDashboardPage />);
    expect(screen.getByText("Loading courses...")).toBeInTheDocument();
  });

  it("fetches courses from /api/courses on mount", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ courses: [] }),
    } as Response);

    render(<TeacherDashboardPage />);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/courses");
    });
  });

  it("displays courses when fetch succeeds", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ courses: mockCourses }),
    } as Response);

    render(<TeacherDashboardPage />);
    await waitFor(() => {
      expect(screen.getByText("Intro to Psychology")).toBeInTheDocument();
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

    render(<TeacherDashboardPage />);
    await waitFor(() => {
      expect(screen.getByText("No courses yet")).toBeInTheDocument();
    });
  });

  it("shows error message when fetch returns an error", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Unauthorized" }),
    } as Response);

    render(<TeacherDashboardPage />);
    await waitFor(() => {
      expect(screen.getByText("Unauthorized")).toBeInTheDocument();
    });
  });

  it("shows generic error on network failure", async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error("Network error"));

    render(<TeacherDashboardPage />);
    await waitFor(() => {
      expect(
        screen.getByText("Something went wrong. Please try again.")
      ).toBeInTheDocument();
    });
  });

  it("opens CreateCourseModal when Create Course button is clicked", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ courses: [] }),
    } as Response);

    render(<TeacherDashboardPage />);
    await waitFor(() =>
      expect(screen.getByText("No courses yet")).toBeInTheDocument()
    );

    await userEvent.click(screen.getByRole("button", { name: "Create Course" }));
    expect(screen.getByTestId("create-course-modal")).toBeInTheDocument();
  });

  it("opens CreateCourseModal when empty state button is clicked", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ courses: [] }),
    } as Response);

    render(<TeacherDashboardPage />);
    await waitFor(() =>
      expect(screen.getByText("No courses yet")).toBeInTheDocument()
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Create Your First Course" })
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

    render(<TeacherDashboardPage />);
    await waitFor(() =>
      expect(screen.getByText("No courses yet")).toBeInTheDocument()
    );

    await userEvent.click(screen.getByRole("button", { name: "Create Course" }));
    await userEvent.click(
      screen.getByRole("button", { name: "Simulate Course Created" })
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(screen.getByText("Intro to Psychology")).toBeInTheDocument();
    });
  });
});
