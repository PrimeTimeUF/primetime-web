"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button, Card, AudioPlayer } from "@/components";
import type {
  PrimingSession,
  PrimingSessionContent,
  SessionQuestion,
} from "@/lib/types/priming-session";

interface SessionDetail extends PrimingSession {
  material: { file_name: string };
  course: { title: string; course_code: string };
}

export default function SessionDetailPage() {
  const { id: courseId, sessionId } = useParams<{
    id: string;
    sessionId: string;
  }>();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [questions, setQuestions] = useState<SessionQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/courses/${courseId}/sessions/${sessionId}`
      );
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to load session.");
        return;
      }
      const data = await res.json();
      setSession(data.session);
      setQuestions(data.questions);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [courseId, sessionId]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const pollAudioStatus = useCallback(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/courses/${courseId}/sessions/${sessionId}`
        );
        if (res.ok) {
          const data = await res.json();
          const s = data.session;
          if (s.audio_status === "ready" || s.audio_status === "failed") {
            setSession(s);
            setQuestions(data.questions);
            setIsGeneratingAudio(false);
            clearInterval(interval);
          }
        }
      } catch {
        // keep polling on network errors
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [courseId, sessionId]);

  const handleGenerateAudio = async () => {
    setIsGeneratingAudio(true);
    try {
      const res = await fetch(
        `/api/courses/${courseId}/sessions/${sessionId}/generate-audio`,
        { method: "POST" }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.cached) {
          setSession((prev) =>
            prev
              ? { ...prev, audio_url: data.audio_url, audio_status: "ready" as const }
              : prev
          );
          setIsGeneratingAudio(false);
        } else {
          pollAudioStatus();
        }
      } else {
        setIsGeneratingAudio(false);
      }
    } catch {
      setIsGeneratingAudio(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-gray-400">Loading session...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-red-500">{error || "Session not found"}</p>
        <Link
          href={`/teacher/courses/${courseId}`}
          className="mt-4 text-sm font-medium text-gray-500 hover:text-black"
        >
          Back to Course
        </Link>
      </div>
    );
  }

  const content = session.content as PrimingSessionContent | null;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Back link */}
      <Link
        href={`/teacher/courses/${courseId}`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-black"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M19 12H5" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
        Back to Course
      </Link>

      {/* Session header */}
      <div className="mb-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          {session.course?.course_code} · {session.material?.file_name}
        </p>
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-black">
        {session.title}
      </h1>
      <p className="mt-2 text-sm text-gray-500">
        Generated{" "}
        {new Date(session.created_at).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })}
      </p>

      {/* Audio section */}
      {session.status === "completed" && (
        <div className="mt-6">
          {session.audio_status === "ready" && session.audio_url ? (
            <AudioPlayer src={session.audio_url} />
          ) : (
            <div>
              <Button
                onClick={handleGenerateAudio}
                variant="secondary"
                disabled={
                  isGeneratingAudio || session.audio_status === "generating"
                }
                iconBefore={
                  !isGeneratingAudio &&
                  session.audio_status !== "generating" ? (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M9 18V5l12-2v13" />
                      <circle cx="6" cy="18" r="3" />
                      <circle cx="18" cy="16" r="3" />
                    </svg>
                  ) : undefined
                }
              >
                {isGeneratingAudio || session.audio_status === "generating"
                  ? "Generating audio..."
                  : "Generate Audio Version"}
              </Button>
              {session.audio_status === "failed" && (
                <p className="mt-2 text-sm text-red-500">
                  Audio generation failed. Try again.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Content sections */}
      {content && (
        <div className="mt-10 space-y-12">
          {/* Introduction */}
          <ContentSection label="Introduction" title={content.introduction.title}>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              {content.introduction.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </ContentSection>

          {/* Key Terms */}
          <ContentSection label="Key Terms" title="Essential Vocabulary">
            <div className="space-y-4">
              {content.keyTerms.map((term, i) => (
                <div
                  key={i}
                  className="rounded-lg border-l-3 border-l-black bg-gray-50 p-5"
                >
                  <p className="text-lg font-semibold text-black">
                    {term.term}
                  </p>
                  <p className="mt-1 text-gray-700 leading-relaxed">
                    {term.definition}
                  </p>
                </div>
              ))}
            </div>
          </ContentSection>

          {/* Core Concepts */}
          <ContentSection label="Core Concepts" title="Key Ideas">
            <div className="space-y-6">
              {content.coreConcepts.map((concept, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black text-sm font-bold text-white">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-black">
                      {concept.title}
                    </h3>
                    <p className="mt-1 text-gray-700 leading-relaxed">
                      {concept.explanation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ContentSection>

          {/* Lecture Preview */}
          <ContentSection
            label="What to Expect"
            title={content.lecturePreview.title}
          >
            <div className="space-y-4 text-gray-700 leading-relaxed">
              {content.lecturePreview.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </ContentSection>
        </div>
      )}

      {/* Quiz Questions */}
      {questions.length > 0 && (
        <div className="mt-16">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-black">
              Check Your Understanding
            </h2>
            <p className="mt-2 text-gray-500">
              {questions.length} questions generated from this material
            </p>
          </div>

          <div className="space-y-6">
            {questions.map((q) => (
              <QuestionCard key={q.id} question={q} />
            ))}
          </div>
        </div>
      )}

      {/* Bottom spacer */}
      <div className="h-16" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Content Section                                                     */
/* ------------------------------------------------------------------ */

interface ContentSectionProps {
  label: string;
  title: string;
  children: React.ReactNode;
}

function ContentSection({
  label,
  title,
  children,
}: Readonly<ContentSectionProps>) {
  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
        {label}
      </p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-black">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Question Card                                                       */
/* ------------------------------------------------------------------ */

interface QuestionCardProps {
  question: SessionQuestion;
}

function QuestionCard({ question }: Readonly<QuestionCardProps>) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  const options = [
    { key: "a", text: question.option_a },
    { key: "b", text: question.option_b },
    { key: "c", text: question.option_c },
    { key: "d", text: question.option_d },
  ];

  const handleSelect = (key: string) => {
    if (revealed) return;
    setSelectedAnswer(key);
  };

  const handleReveal = () => {
    if (!selectedAnswer) return;
    setRevealed(true);
  };

  return (
    <Card className="p-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
        Question {question.question_number} of 4
      </p>
      <p className="mt-2 text-lg font-semibold text-black">
        {question.question_text}
      </p>

      <div className="mt-4 space-y-2">
        {options.map((opt) => {
          const isCorrect = opt.key === question.correct_answer;
          const isSelected = opt.key === selectedAnswer;

          let optionClasses =
            "flex cursor-pointer items-center gap-3 rounded-lg border-2 p-4 transition-colors";

          if (revealed) {
            if (isCorrect) {
              optionClasses += " border-green-500 bg-green-50";
            } else if (isSelected && !isCorrect) {
              optionClasses += " border-red-500 bg-red-50";
            } else {
              optionClasses += " border-gray-200 bg-gray-50 opacity-60";
            }
          } else if (isSelected) {
            optionClasses += " border-black bg-white";
          } else {
            optionClasses += " border-gray-200 bg-gray-50 hover:border-gray-400";
          }

          let letterClasses =
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border-2 text-sm font-bold transition-colors";

          if (revealed && isCorrect) {
            letterClasses += " border-green-500 bg-green-500 text-white";
          } else if (revealed && isSelected && !isCorrect) {
            letterClasses += " border-red-500 bg-red-500 text-white";
          } else if (isSelected) {
            letterClasses += " border-black bg-black text-white";
          } else {
            letterClasses += " border-gray-300 bg-white text-gray-700";
          }

          return (
            <button
              key={opt.key}
              onClick={() => handleSelect(opt.key)}
              className={optionClasses}
              disabled={revealed}
            >
              <span className={letterClasses}>
                {opt.key.toUpperCase()}
              </span>
              <span className="text-left text-gray-700">{opt.text}</span>
            </button>
          );
        })}
      </div>

      {!revealed && (
        <Button
          className="mt-4 w-full"
          disabled={!selectedAnswer}
          onClick={handleReveal}
        >
          Check Answer
        </Button>
      )}

      {revealed && question.explanation && (
        <div className="mt-4 rounded-lg bg-gray-50 p-4">
          <p className="text-sm font-semibold text-black">Explanation</p>
          <p className="mt-1 text-sm text-gray-700 leading-relaxed">
            {question.explanation}
          </p>
        </div>
      )}
    </Card>
  );
}
