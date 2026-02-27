import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StudentDashboardPage from "./page";

// --- Mocks ---
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockGetSession = vi.fn();
const mockSingle = vi.fn();
vi.mock("@/utils/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: { getSession: mockGetSession },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: mockSingle,
    })),
  })),
}));

global.fetch = vi.fn();

vi.mock("@/components", () => ({
  EnrollCourseModal: ({
    open,
    onEnrolled,
  }: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    onEnrolled: () => void;
  }) =>
    open ? (
      <div data-testid="enroll-course-modal">
        <button onClick={onEnrolled}>Simulate Enrolled</button>
      </div>
    ) : null,
}));

// --- Test Helpers ---
const mockSession = { user: { id: "s1" } };
const mockUser = {
  id: "s1",
  email: "jane@test.com",
  role: "student",
  full_name: "Jane Doe",
};

const mockEnrollment = {
  id: "e1",
  enrolled_at: "2026-01-01",
  course: {
    id: "c1",
    title: "Intro to Psychology",
    course_code: "PSY101",
    semester: "Fall 2026",
    description: null,
  },
};

function setupDefaultMocks(enrollments: unknown[] = []) {
  mockGetSession.mockResolvedValue({
    data: { session: mockSession },
    error: null,
  });
  mockSingle.mockResolvedValue({ data: mockUser, error: null });
  vi.mocked(global.fetch).mockResolvedValue({
    ok: true,
    json: async () => ({ enrollments }),
  } as Response);
}

describe("StudentDashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state initially", () => {
    mockGetSession.mockImplementation(() => new Promise(() => {}));
    vi.mocked(global.fetch).mockImplementation(() => new Promise(() => {}));

    render(<StudentDashboardPage />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("redirects to /login when session does not exist", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ enrollments: [] }),
    } as Response);

    render(<StudentDashboardPage />);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });

  it("shows error message when user data fetch fails", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });
    mockSingle.mockResolvedValue({ data: null, error: { message: "Not found" } });
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ enrollments: [] }),
    } as Response);

    render(<StudentDashboardPage />);
    await waitFor(() => {
      expect(screen.getByText("Error loading user data")).toBeInTheDocument();
    });
  });

  it("renders welcome message with the user's first name", async () => {
    setupDefaultMocks();

    render(<StudentDashboardPage />);
    await waitFor(() => {
      expect(screen.getByText("Welcome back, Jane")).toBeInTheDocument();
    });
  });

  it("shows empty state when student has no enrollments", async () => {
    setupDefaultMocks([]);

    render(<StudentDashboardPage />);
    await waitFor(() => {
      expect(screen.getByText("No courses yet")).toBeInTheDocument();
    });
  });

  it("displays enrollment count in subtitle for multiple courses", async () => {
    setupDefaultMocks([mockEnrollment, { ...mockEnrollment, id: "e2" }]);

    render(<StudentDashboardPage />);
    await waitFor(() => {
      expect(screen.getByText("You have 2 courses")).toBeInTheDocument();
    });
  });

  it("uses singular 'course' for exactly one enrollment", async () => {
    setupDefaultMocks([mockEnrollment]);

    render(<StudentDashboardPage />);
    await waitFor(() => {
      expect(screen.getByText("You have 1 course")).toBeInTheDocument();
    });
  });

  it("displays enrolled course cards with title and details", async () => {
    setupDefaultMocks([mockEnrollment]);

    render(<StudentDashboardPage />);
    await waitFor(() => {
      expect(screen.getByText("Intro to Psychology")).toBeInTheDocument();
      expect(screen.getByText("PSY101 · Fall 2026")).toBeInTheDocument();
    });
  });

  it("opens EnrollCourseModal when Enroll in Course header button is clicked", async () => {
    setupDefaultMocks();

    render(<StudentDashboardPage />);
    await waitFor(() =>
      expect(screen.getByText("No courses yet")).toBeInTheDocument()
    );

    await userEvent.click(screen.getByRole("button", { name: /Enroll in Course/i }));
    expect(screen.getByTestId("enroll-course-modal")).toBeInTheDocument();
  });

  it("opens EnrollCourseModal when empty state button is clicked", async () => {
    setupDefaultMocks();

    render(<StudentDashboardPage />);
    await waitFor(() =>
      expect(screen.getByText("No courses yet")).toBeInTheDocument()
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Enroll in Your First Course" })
    );
    expect(screen.getByTestId("enroll-course-modal")).toBeInTheDocument();
  });

  it("refetches enrollments after onEnrolled callback fires", async () => {
    const updatedEnrollment = {
      ...mockEnrollment,
      course: { ...mockEnrollment.course, title: "New Course" },
    };

    mockGetSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });
    mockSingle.mockResolvedValue({ data: mockUser, error: null });
    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ enrollments: [] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ enrollments: [updatedEnrollment] }),
      } as Response);

    render(<StudentDashboardPage />);
    await waitFor(() =>
      expect(screen.getByText("No courses yet")).toBeInTheDocument()
    );

    await userEvent.click(screen.getByRole("button", { name: /Enroll in Course/i }));
    await userEvent.click(
      screen.getByRole("button", { name: "Simulate Enrolled" })
    );

    await waitFor(() => {
      expect(screen.getByText("New Course")).toBeInTheDocument();
    });
  });
});
