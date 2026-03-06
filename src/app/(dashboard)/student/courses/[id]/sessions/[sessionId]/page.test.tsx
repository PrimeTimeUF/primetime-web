import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import StudentSessionPage from "./page";

global.fetch = vi.fn();

const mockGet = vi.fn().mockReturnValue(null);
vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "course-1", sessionId: "session-1" }),
  useSearchParams: () => ({ get: mockGet }),
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const mockContent = {
  introduction: {
    title: "Welcome to Biology",
    paragraphs: ["This session covers cell biology.", "Cells are the building blocks of life."],
  },
  keyTerms: [
    { term: "Cell", definition: "The basic unit of life" },
    { term: "Mitosis", definition: "Cell division process" },
  ],
  coreConcepts: [
    { title: "Cell Theory", explanation: "All living things are made of cells." },
  ],
  lecturePreview: {
    title: "What to Expect in Class",
    paragraphs: ["The lecture will cover cell structure."],
  },
};

const mockQuestions = [
  {
    id: "q1",
    session_id: "session-1",
    question_number: 1,
    question_text: "What is the basic unit of life?",
    option_a: "Atom",
    option_b: "Cell",
    option_c: "Molecule",
    option_d: "Organ",
    correct_answer: "b" as const,
    explanation: "Cells are the basic units of life.",
    created_at: "2025-06-01T00:00:00Z",
  },
  {
    id: "q2",
    session_id: "session-1",
    question_number: 2,
    question_text: "What is mitosis?",
    option_a: "Cell death",
    option_b: "Cell growth",
    option_c: "Cell division",
    option_d: "Cell movement",
    correct_answer: "c" as const,
    explanation: null,
    created_at: "2025-06-01T00:00:00Z",
  },
];

const mockSession = {
  id: "session-1",
  material_id: "mat-1",
  course_id: "course-1",
  title: "Cell Biology Review",
  status: "completed" as const,
  content: mockContent,
  error_message: null,
  created_at: "2025-06-01T00:00:00Z",
  completed_at: "2025-06-01T01:00:00Z",
  lecture_name: "Lecture 1",
  duration: 15 as const,
  audio_url: null,
  audio_status: "none" as const,
  material: { file_name: "notes.pdf" },
  course: { title: "Biology 101", course_code: "BIO101" },
};

function mockSessionFetch() {
  vi.mocked(global.fetch).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ session: mockSession, questions: mockQuestions }),
  } as Response);
}

describe("StudentSessionPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockReturnValue(null);
  });

  it("shows loading state initially", () => {
    vi.mocked(global.fetch).mockImplementation(() => new Promise(() => {}));
    render(<StudentSessionPage />);
    expect(screen.getByText("Loading session...")).toBeInTheDocument();
  });

  it("shows error state", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Session not found" }),
    } as Response);
    render(<StudentSessionPage />);
    await waitFor(() => {
      expect(screen.getByText("Session not found")).toBeInTheDocument();
    });
    expect(screen.getByText("Back to Course")).toBeInTheDocument();
  });

  it("renders session header", async () => {
    mockSessionFetch();
    render(<StudentSessionPage />);
    await waitFor(() => {
      expect(screen.getByText("Cell Biology Review")).toBeInTheDocument();
    });
    expect(screen.getByText(/BIO101/)).toBeInTheDocument();
  });

  it("renders phase indicators", async () => {
    mockSessionFetch();
    render(<StudentSessionPage />);
    await waitFor(() => {
      expect(screen.getByText("reading")).toBeInTheDocument();
    });
    expect(screen.getByText("quiz")).toBeInTheDocument();
    expect(screen.getByText("results")).toBeInTheDocument();
  });

  it("starts in reading phase with content sections", async () => {
    mockSessionFetch();
    render(<StudentSessionPage />);
    await waitFor(() => {
      expect(screen.getByText("Welcome to Biology")).toBeInTheDocument();
    });
    expect(screen.getByText("This session covers cell biology.")).toBeInTheDocument();
    expect(screen.getByText("Essential Vocabulary")).toBeInTheDocument();
    expect(screen.getByText("Cell")).toBeInTheDocument();
    expect(screen.getByText("The basic unit of life")).toBeInTheDocument();
    expect(screen.getByText("Key Ideas")).toBeInTheDocument();
    expect(screen.getByText("Cell Theory")).toBeInTheDocument();
  });

  it("shows Start Quiz button", async () => {
    mockSessionFetch();
    render(<StudentSessionPage />);
    await waitFor(() => {
      expect(screen.getByText("Start Quiz (2 questions)")).toBeInTheDocument();
    });
  });

  it("transitions to quiz phase on Start Quiz click", async () => {
    mockSessionFetch();
    render(<StudentSessionPage />);
    await waitFor(() => {
      expect(screen.getByText("Start Quiz (2 questions)")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText("Start Quiz (2 questions)"));

    expect(screen.getByText("Check Your Understanding")).toBeInTheDocument();
    expect(screen.getByText("What is the basic unit of life?")).toBeInTheDocument();
    expect(screen.getByText("What is mitosis?")).toBeInTheDocument();
  });

  it("renders quiz options", async () => {
    mockSessionFetch();
    render(<StudentSessionPage />);
    await waitFor(() => {
      expect(screen.getByText("Start Quiz (2 questions)")).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText("Start Quiz (2 questions)"));

    expect(screen.getByText("Atom")).toBeInTheDocument();
    expect(screen.getByText("Cell", { selector: "span" })).toBeInTheDocument();
    expect(screen.getByText("Molecule")).toBeInTheDocument();
    expect(screen.getByText("Organ")).toBeInTheDocument();
  });

  it("disables submit until all answered", async () => {
    mockSessionFetch();
    render(<StudentSessionPage />);
    await waitFor(() => {
      expect(screen.getByText("Start Quiz (2 questions)")).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText("Start Quiz (2 questions)"));

    expect(screen.getByText("Submit Quiz")).toBeDisabled();
  });

  it("submits quiz and shows results", async () => {
    mockSessionFetch();
    render(<StudentSessionPage />);
    await waitFor(() => {
      expect(screen.getByText("Start Quiz (2 questions)")).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText("Start Quiz (2 questions)"));

    // Select answer for Q1 (Cell = option b)
    const cellOption = screen.getByText("Cell", { selector: "span" });
    await userEvent.click(cellOption.closest("button")!);

    // Select answer for Q2 (Cell division = option c)
    const divisionOption = screen.getByText("Cell division");
    await userEvent.click(divisionOption.closest("button")!);

    // Mock submit response
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        score: 2,
        total_questions: 2,
        results: [
          { question_id: "q1", question_number: 1, selected: "b", correct_answer: "b", is_correct: true },
          { question_id: "q2", question_number: 2, selected: "c", correct_answer: "c", is_correct: true },
        ],
      }),
    } as Response);

    await userEvent.click(screen.getByText("Submit Quiz"));

    await waitFor(() => {
      expect(screen.getByText("2/2")).toBeInTheDocument();
    });
    expect(screen.getByText("You scored 100%")).toBeInTheDocument();
  });

  it("renders in review mode with existing results", async () => {
    mockGet.mockReturnValue("true");

    // Session fetch
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ session: mockSession, questions: mockQuestions }),
    } as Response);
    // Existing result fetch
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        result: { score: 1, total_questions: 2 },
      }),
    } as Response);

    render(<StudentSessionPage />);

    await waitFor(() => {
      expect(screen.getByText("1/2")).toBeInTheDocument();
    });
    expect(screen.getByText("You scored 50%")).toBeInTheDocument();
  });

  it("posts quiz answers to correct endpoint", async () => {
    mockSessionFetch();
    render(<StudentSessionPage />);
    await waitFor(() => {
      expect(screen.getByText("Start Quiz (2 questions)")).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText("Start Quiz (2 questions)"));

    // Select answers
    await userEvent.click(screen.getByText("Atom").closest("button")!);
    await userEvent.click(screen.getByText("Cell death").closest("button")!);

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ score: 0, total_questions: 2, results: [] }),
    } as Response);

    await userEvent.click(screen.getByText("Submit Quiz"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/student/sessions/session-1/results",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ course_id: "course-1", answers: { q1: "a", q2: "a" } }),
        })
      );
    });
  });
});
