"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Card } from "@/components";
import type {
  PrimingSession,
  PrimingSessionContent,
  SessionQuestion,
} from "@/lib/types/priming-session";

type Phase = "reading" | "quiz" | "results";

interface SessionDetail extends PrimingSession {
  material: { file_name: string };
  course: { title: string; course_code: string };
}

interface QuizResult {
  question_id: string;
  question_number: number;
  selected: string | null;
  correct_answer: string;
  is_correct: boolean;
}

export default function StudentSessionPage() {
  const { id: courseId, sessionId } = useParams<{
    id: string;
    sessionId: string;
  }>();
  const searchParams = useSearchParams();
  const isReview = searchParams.get("review") === "true";

  const [session, setSession] = useState<SessionDetail | null>(null);
  const [questions, setQuestions] = useState<SessionQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [phase, setPhase] = useState<Phase>(isReview ? "results" : "reading");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    }
  }, [courseId, sessionId]);

  const fetchExistingResult = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/student/sessions/${sessionId}/results`
      );
      if (res.ok) {
        const data = await res.json();
        setScore(data.result.score);
        setTotalQuestions(data.result.total_questions);
        setPhase("results");
      }
    } catch {
      // No existing result — stay on reading phase
    }
  }, [sessionId]);

  useEffect(() => {
    async function loadData() {
      await fetchSession();
      if (isReview) {
        await fetchExistingResult();
      }
      setIsLoading(false);
    }
    loadData();
  }, [fetchSession, fetchExistingResult, isReview]);

  const allAnswered =
    questions.length > 0 &&
    questions.every((q) => answers[q.id] !== undefined);

  const handleSelectAnswer = (questionId: string, key: string) => {
    if (phase !== "quiz") return;
    setAnswers((prev) => ({ ...prev, [questionId]: key }));
  };

  const handleSubmitQuiz = async () => {
    if (!allAnswered || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/student/sessions/${sessionId}/results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course_id: courseId, answers }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to submit quiz.");
        setIsSubmitting(false);
        return;
      }

      setScore(data.score);
      setTotalQuestions(data.total_questions);
      setQuizResults(data.results);
      setPhase("results");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
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
          href={`/student/courses/${courseId}`}
          className="mt-4 text-sm font-medium text-gray-500 hover:text-black"
        >
          Back to Course
        </Link>
      </div>
    );
  }

  const content = session.content as PrimingSessionContent | null;
  const scorePercentage =
    totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  // Build a map from question id to result for the results phase
  const resultMap = new Map(quizResults.map((r) => [r.question_id, r]));

  return (
    <div className="mx-auto max-w-3xl">
      {/* Back link */}
      <Link
        href={`/student/courses/${courseId}`}
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

      {/* Phase indicator */}
      <div className="mt-4 flex items-center gap-3">
        {(["reading", "quiz", "results"] as Phase[]).map((p, i) => (
          <div key={p} className="flex items-center gap-3">
            {i > 0 && <div className="h-px w-6 bg-gray-300" />}
            <div
              className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
                phase === p
                  ? "bg-black text-white"
                  : phases.indexOf(phase) > i
                    ? "bg-gray-200 text-gray-700"
                    : "bg-gray-100 text-gray-400"
              }`}
            >
              <span>{i + 1}</span>
              <span className="capitalize">{p}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Reading Phase ── */}
      {phase === "reading" && content && (
        <div className="mt-10 space-y-12">
          <ContentSection label="Introduction" title={content.introduction.title}>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              {content.introduction.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </ContentSection>

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

          {questions.length > 0 && (
            <div className="flex justify-center pt-4 pb-8">
              <Button
                size="lg"
                onClick={() => setPhase("quiz")}
              >
                Start Quiz ({questions.length} questions)
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── Quiz Phase ── */}
      {phase === "quiz" && (
        <div className="mt-10">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-black">
              Check Your Understanding
            </h2>
            <p className="mt-2 text-gray-500">
              Answer all {questions.length} questions, then submit.
            </p>
          </div>

          <div className="space-y-6">
            {questions.map((q) => (
              <QuizQuestionCard
                key={q.id}
                question={q}
                selectedAnswer={answers[q.id] || null}
                onSelect={(key) => handleSelectAnswer(q.id, key)}
              />
            ))}
          </div>

          <div className="mt-8 flex justify-center pb-8">
            <Button
              size="lg"
              disabled={!allAnswered || isSubmitting}
              onClick={handleSubmitQuiz}
            >
              {isSubmitting ? "Submitting..." : "Submit Quiz"}
            </Button>
          </div>
        </div>
      )}

      {/* ── Results Phase ── */}
      {phase === "results" && (
        <div className="mt-10">
          {/* Score Banner */}
          <Card
            className={`mb-8 p-8 text-center ${
              scorePercentage >= 70
                ? "border-green-200 bg-green-50"
                : scorePercentage >= 50
                  ? "border-amber-200 bg-amber-50"
                  : "border-red-200 bg-red-50"
            }`}
          >
            <p className="text-5xl font-bold text-black">
              {score}/{totalQuestions}
            </p>
            <p className="mt-2 text-lg text-gray-700">
              You scored {scorePercentage}%
            </p>
          </Card>

          {/* Show answered questions with results if we have detailed results */}
          {quizResults.length > 0 && questions.length > 0 && (
            <div className="space-y-6">
              {questions.map((q) => {
                const result = resultMap.get(q.id);
                return (
                  <ResultQuestionCard
                    key={q.id}
                    question={q}
                    selected={result?.selected || null}
                    isCorrect={result?.is_correct ?? false}
                  />
                );
              })}
            </div>
          )}

          {/* Review mode without detailed results (just score) */}
          {quizResults.length === 0 && (
            <p className="text-center text-gray-500">
              Detailed question results are not available for review.
            </p>
          )}

          <div className="mt-8 flex justify-center pb-8">
            <Link
              href={`/student/courses/${courseId}`}
              className="inline-flex items-center gap-2 rounded-lg bg-black px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800"
            >
              Back to Course
            </Link>
          </div>
        </div>
      )}

      <div className="h-16" />
    </div>
  );
}

const phases: Phase[] = ["reading", "quiz", "results"];

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
/*  Quiz Question Card (no reveal)                                      */
/* ------------------------------------------------------------------ */

interface QuizQuestionCardProps {
  question: SessionQuestion;
  selectedAnswer: string | null;
  onSelect: (key: string) => void;
}

function QuizQuestionCard({
  question,
  selectedAnswer,
  onSelect,
}: Readonly<QuizQuestionCardProps>) {
  const options = [
    { key: "a", text: question.option_a },
    { key: "b", text: question.option_b },
    { key: "c", text: question.option_c },
    { key: "d", text: question.option_d },
  ];

  return (
    <Card className="p-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
        Question {question.question_number}
      </p>
      <p className="mt-2 text-lg font-semibold text-black">
        {question.question_text}
      </p>

      <div className="mt-4 space-y-2">
        {options.map((opt) => {
          const isSelected = opt.key === selectedAnswer;

          return (
            <button
              key={opt.key}
              onClick={() => onSelect(opt.key)}
              className={`flex w-full cursor-pointer items-center gap-3 rounded-lg border-2 p-4 transition-colors ${
                isSelected
                  ? "border-black bg-white"
                  : "border-gray-200 bg-gray-50 hover:border-gray-400"
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border-2 text-sm font-bold transition-colors ${
                  isSelected
                    ? "border-black bg-black text-white"
                    : "border-gray-300 bg-white text-gray-700"
                }`}
              >
                {opt.key.toUpperCase()}
              </span>
              <span className="text-left text-gray-700">{opt.text}</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Result Question Card (with correct/incorrect coloring)              */
/* ------------------------------------------------------------------ */

interface ResultQuestionCardProps {
  question: SessionQuestion;
  selected: string | null;
  isCorrect: boolean;
}

function ResultQuestionCard({
  question,
  selected,
  isCorrect,
}: Readonly<ResultQuestionCardProps>) {
  const options = [
    { key: "a", text: question.option_a },
    { key: "b", text: question.option_b },
    { key: "c", text: question.option_c },
    { key: "d", text: question.option_d },
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Question {question.question_number}
        </p>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            isCorrect
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {isCorrect ? "Correct" : "Incorrect"}
        </span>
      </div>
      <p className="mt-2 text-lg font-semibold text-black">
        {question.question_text}
      </p>

      <div className="mt-4 space-y-2">
        {options.map((opt) => {
          const isThisCorrect = opt.key === question.correct_answer;
          const isThisSelected = opt.key === selected;

          let optionClasses =
            "flex w-full items-center gap-3 rounded-lg border-2 p-4";
          let letterClasses =
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border-2 text-sm font-bold";

          if (isThisCorrect) {
            optionClasses += " border-green-500 bg-green-50";
            letterClasses += " border-green-500 bg-green-500 text-white";
          } else if (isThisSelected && !isThisCorrect) {
            optionClasses += " border-red-500 bg-red-50";
            letterClasses += " border-red-500 bg-red-500 text-white";
          } else {
            optionClasses += " border-gray-200 bg-gray-50 opacity-60";
            letterClasses += " border-gray-300 bg-white text-gray-700";
          }

          return (
            <div key={opt.key} className={optionClasses}>
              <span className={letterClasses}>
                {opt.key.toUpperCase()}
              </span>
              <span className="text-left text-gray-700">{opt.text}</span>
            </div>
          );
        })}
      </div>

      {question.explanation && (
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
