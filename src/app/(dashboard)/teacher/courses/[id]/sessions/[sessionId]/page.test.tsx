import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import SessionDetailPage from "./page";

global.fetch = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "course-1", sessionId: "session-1" }),
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/components", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    AudioPlayer: ({ src, isDark }: { src: string; isDark?: boolean }) => (
      <div data-testid="audio-player">AudioPlayer: {src} (dark: {isDark ? 'yes' : 'no'})</div>
    ),
  };
});

const mockContent = {
  introduction: {
    title: "Introduction to Cells",
    paragraphs: ["Cells are the fundamental units of life."],
  },
  keyTerms: [{ term: "Nucleus", definition: "Control center of the cell" }],
  coreConcepts: [{ title: "Cell Theory", explanation: "All organisms are made of cells." }],
  lecturePreview: {
    title: "Upcoming Lecture",
    paragraphs: ["We will discuss organelles."],
  },
};

const mockQuestions = [
  {
    id: "q1",
    session_id: "session-1",
    question_number: 1,
    question_text: "What controls the cell?",
    option_a: "Membrane",
    option_b: "Nucleus",
    option_c: "Ribosome",
    option_d: "Cytoplasm",
    correct_answer: "b" as const,
    explanation: "The nucleus is the control center.",
    created_at: "2025-06-01T00:00:00Z",
  },
];

const mockSession = {
  id: "session-1",
  material_id: "mat-1",
  course_id: "course-1",
  title: "Cell Biology Session",
  status: "completed" as const,
  content: mockContent,
  error_message: null,
  created_at: "2025-06-01T10:30:00Z",
  completed_at: "2025-06-01T11:00:00Z",
  lecture_name: "Lecture 1",
  duration: 15 as const,
  audio_url: null as string | null,
  audio_status: "none" as "none" | "generating" | "ready" | "failed",
  material: { file_name: "notes.pdf" },
  course: { title: "Biology 101", course_code: "BIO101" },
};

function mockSessionFetch(session = mockSession, questions = mockQuestions) {
  vi.mocked(global.fetch).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ session, questions }),
  } as Response);
}

describe("SessionDetailPage (Teacher)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state initially", () => {
    vi.mocked(global.fetch).mockImplementation(() => new Promise(() => {}));
    render(<SessionDetailPage />);
    expect(screen.getByText("Loading session...")).toBeInTheDocument();
  });

  it("shows error state", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Session not found" }),
    } as Response);
    render(<SessionDetailPage />);
    await waitFor(() => {
      expect(screen.getByText("Session not found")).toBeInTheDocument();
    });
    expect(screen.getByText("Back to Course")).toBeInTheDocument();
  });

  it("renders session header", async () => {
    mockSessionFetch();
    render(<SessionDetailPage />);
    await waitFor(() => {
      expect(screen.getByText("Cell Biology Session")).toBeInTheDocument();
    });
    expect(screen.getByText(/BIO101/)).toBeInTheDocument();
    expect(screen.getByText(/notes.pdf/)).toBeInTheDocument();
  });

  it("renders content sections", async () => {
    mockSessionFetch();
    render(<SessionDetailPage />);
    await waitFor(() => {
      expect(screen.getByText("Introduction to Cells")).toBeInTheDocument();
    });
    expect(screen.getByText("Cells are the fundamental units of life.")).toBeInTheDocument();
    expect(screen.getByText("Essential Vocabulary")).toBeInTheDocument();
    expect(screen.getAllByText("Nucleus")[0]).toBeInTheDocument();
    expect(screen.getByText("Control center of the cell")).toBeInTheDocument();
    expect(screen.getByText("Key Ideas")).toBeInTheDocument();
    expect(screen.getByText("Cell Theory")).toBeInTheDocument();
  });

  it("renders quiz questions", async () => {
    mockSessionFetch();
    render(<SessionDetailPage />);
    await waitFor(() => {
      expect(screen.getByText("Check Your Understanding")).toBeInTheDocument();
    });
    expect(screen.getByText("What controls the cell?")).toBeInTheDocument();
    expect(screen.getByText("Membrane")).toBeInTheDocument();
    expect(screen.getAllByText("Nucleus")[0]).toBeInTheDocument();
  });

  it("shows Generate Audio button when no audio exists", async () => {
    mockSessionFetch();
    render(<SessionDetailPage />);
    await waitFor(() => {
      expect(screen.getByText("Generate Audio Version")).toBeInTheDocument();
    });
  });

  it("shows AudioPlayer when audio is ready", async () => {
    mockSessionFetch({
      ...mockSession,
      audio_url: "https://example.com/audio.mp3",
      audio_status: "ready" as const,
    });
    render(<SessionDetailPage />);
    await waitFor(() => {
      expect(screen.getByTestId("audio-player")).toBeInTheDocument();
    });
    expect(screen.getByText("AudioPlayer: https://example.com/audio.mp3")).toBeInTheDocument();
  });

  it("shows failed audio message", async () => {
    mockSessionFetch({
      ...mockSession,
      audio_status: "failed" as const,
    });
    render(<SessionDetailPage />);
    await waitFor(() => {
      expect(screen.getByText("Audio generation failed. Try again.")).toBeInTheDocument();
    });
  });

  it("handles cached audio generation", async () => {
    mockSessionFetch();
    render(<SessionDetailPage />);
    await waitFor(() => {
      expect(screen.getByText("Generate Audio Version")).toBeInTheDocument();
    });

    // Mock generate response with cached=true
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        cached: true,
        audio_url: "https://example.com/cached.mp3",
      }),
    } as Response);

    await userEvent.click(screen.getByText("Generate Audio Version"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/courses/course-1/sessions/session-1/generate-audio",
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  it("shows generating state for audio button", async () => {
    mockSessionFetch({
      ...mockSession,
      audio_status: "generating" as const,
    });
    render(<SessionDetailPage />);
    await waitFor(() => {
      expect(screen.getByText("Generating audio...")).toBeInTheDocument();
    });
  });

  it("fetches session on mount", async () => {
    mockSessionFetch();
    render(<SessionDetailPage />);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/courses/course-1/sessions/session-1"
      );
    });
  });

  it("renders question count text", async () => {
    mockSessionFetch();
    render(<SessionDetailPage />);
    await waitFor(() => {
      expect(screen.getByText("1 questions generated from this material")).toBeInTheDocument();
    });
  });
});
