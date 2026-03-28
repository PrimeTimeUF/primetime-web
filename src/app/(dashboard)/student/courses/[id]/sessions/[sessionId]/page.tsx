"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AudioPlayer } from "@/components";
import { useDashboardTheme } from "../../../../../teacher/dashboard-theme-context";
import { BrutalistCard, BrutalistButton, BrutalistBadge, themeTokens } from "@/components/ui/dashboard-primitives";
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
  const { isDark } = useDashboardTheme();
  const t = themeTokens(isDark);

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
      const res = await fetch(`/api/courses/${courseId}/sessions/${sessionId}`);
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
      const res = await fetch(`/api/student/sessions/${sessionId}/results`);
      if (res.ok) {
        const data = await res.json();
        setScore(data.result.score);
        setTotalQuestions(data.result.total_questions);
        setPhase("results");
      }
    } catch {
      // No existing result
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
        <p className={`font-mono text-sm ${t.textMid}`}>LOADING SESSION...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className={`font-mono text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>{error || "Session not found"}</p>
        <Link
          href={`/student/courses/${courseId}`}
          className={`mt-4 font-mono text-xs tracking-wider ${t.textMid} ${isDark ? 'hover:text-white' : 'hover:text-black'}`}
        >
          BACK TO COURSE
        </Link>
      </div>
    );
  }

  const content = session.content as PrimingSessionContent | null;
  const scorePercentage =
    totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  const resultMap = new Map(quizResults.map((r) => [r.question_id, r]));

  return (
    <div className="mx-auto max-w-3xl">
      {/* Back link */}
      <Link
        href={`/student/courses/${courseId}`}
        className={`mb-6 inline-flex items-center gap-2 font-mono text-xs tracking-wider ${t.textMid} transition-colors ${isDark ? 'hover:text-white' : 'hover:text-black'}`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M19 12H5" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
        BACK TO COURSE
      </Link>

      {/* Session header */}
      <div className="mb-2">
        <p className={`font-mono text-[10px] tracking-[0.25em] uppercase ${t.textDim}`}>
          {session.course?.course_code} · {session.material?.file_name}
        </p>
      </div>
      <h1 className={`font-mono text-2xl font-bold tracking-wider ${t.text}`}>
        {session.title}
      </h1>

      {/* Phase indicator */}
      <div className="mt-4 flex items-center gap-3">
        {(["reading", "quiz", "results"] as Phase[]).map((p, i) => (
          <div key={p} className="flex items-center gap-3">
            {i > 0 && <div className={`h-px w-6 ${isDark ? 'bg-white/20' : 'bg-black/15'}`} />}
            <div
              className={`flex items-center gap-2 border px-3 py-1 font-mono text-[10px] tracking-wider uppercase transition-colors ${
                phase === p
                  ? `${t.borderFull} ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`
                  : phases.indexOf(phase) > i
                    ? `${t.borderMid} ${t.textMid}`
                    : `${t.border} ${t.textDim}`
              }`}
            >
              <span>{i + 1}</span>
              <span>{p}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Audio Player */}
      {phase === "reading" && session.audio_status === "ready" && session.audio_url && (
        <div className="mt-6">
          <AudioPlayer src={session.audio_url} />
        </div>
      )}

      {/* ── Reading Phase ── */}
      {phase === "reading" && content && (
        <div className="mt-10 space-y-12">
          <ContentSection label="INTRODUCTION" title={content.introduction.title} isDark={isDark}>
            <div className={`space-y-4 font-mono text-sm ${t.textMid} leading-relaxed`}>
              {content.introduction.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </ContentSection>

          <ContentSection label="KEY TERMS" title="Essential Vocabulary" isDark={isDark}>
            <div className="space-y-4">
              {content.keyTerms.map((term, i) => (
                <div
                  key={i}
                  className={`border-l-2 ${isDark ? 'border-l-white/40' : 'border-l-black/30'} ${t.cardBg} p-5`}
                >
                  <p className={`font-mono text-sm font-bold ${t.text} tracking-wider`}>
                    {term.term}
                  </p>
                  <p className={`mt-1 font-mono text-sm ${t.textMid} leading-relaxed`}>
                    {term.definition}
                  </p>
                </div>
              ))}
            </div>
          </ContentSection>

          <ContentSection label="CORE CONCEPTS" title="Key Ideas" isDark={isDark}>
            <div className="space-y-6">
              {content.coreConcepts.map((concept, i) => (
                <div key={i} className="flex gap-4">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center border ${t.borderFull} font-mono text-xs font-bold ${t.text}`}>
                    {i + 1}
                  </div>
                  <div>
                    <h3 className={`font-mono text-sm font-bold ${t.text} tracking-wider`}>
                      {concept.title}
                    </h3>
                    <p className={`mt-1 font-mono text-sm ${t.textMid} leading-relaxed`}>
                      {concept.explanation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ContentSection>

          <ContentSection label="WHAT TO EXPECT" title={content.lecturePreview.title} isDark={isDark}>
            <div className={`space-y-4 font-mono text-sm ${t.textMid} leading-relaxed`}>
              {content.lecturePreview.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </ContentSection>

          {questions.length > 0 && (
            <div className="flex justify-center pt-4 pb-8">
              <BrutalistButton isDark={isDark} size="lg" onClick={() => setPhase("quiz")}>
                START QUIZ ({questions.length} QUESTIONS)
              </BrutalistButton>
            </div>
          )}
        </div>
      )}

      {/* ── Quiz Phase ── */}
      {phase === "quiz" && (
        <div className="mt-10">
          <div className="mb-8 text-center">
            <h2 className={`font-mono text-2xl font-bold ${t.text} tracking-wider`}>
              CHECK YOUR UNDERSTANDING
            </h2>
            <p className={`mt-2 font-mono text-sm ${t.textMid}`}>
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
                isDark={isDark}
              />
            ))}
          </div>

          <div className="mt-8 flex justify-center pb-8">
            <BrutalistButton
              isDark={isDark}
              size="lg"
              disabled={!allAnswered || isSubmitting}
              onClick={handleSubmitQuiz}
              isLoading={isSubmitting}
            >
              SUBMIT QUIZ
            </BrutalistButton>
          </div>
        </div>
      )}

      {/* ── Results Phase ── */}
      {phase === "results" && (
        <div className="mt-10">
          {/* Score Banner */}
          <BrutalistCard isDark={isDark} className="mb-8 text-center !p-8">
            <p className={`font-mono text-5xl font-bold ${
              scorePercentage >= 70
                ? isDark ? 'text-green-400' : 'text-green-600'
                : scorePercentage >= 50
                  ? isDark ? 'text-amber-400' : 'text-amber-600'
                  : isDark ? 'text-red-400' : 'text-red-600'
            }`}>
              {score}/{totalQuestions}
            </p>
            <p className={`mt-2 font-mono text-sm ${t.textMid} tracking-wider`}>
              YOU SCORED {scorePercentage}%
            </p>
          </BrutalistCard>

          {/* Detailed results */}
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
                    isDark={isDark}
                  />
                );
              })}
            </div>
          )}

          {quizResults.length === 0 && (
            <p className={`text-center font-mono text-sm ${t.textMid}`}>
              Detailed question results are not available for review.
            </p>
          )}

          <div className="mt-8 flex justify-center pb-8">
            <Link href={`/student/courses/${courseId}`}>
              <BrutalistButton isDark={isDark} size="lg">
                BACK TO COURSE
              </BrutalistButton>
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
  isDark: boolean;
}

function ContentSection({ label, title, children, isDark }: Readonly<ContentSectionProps>) {
  const t = themeTokens(isDark);
  return (
    <section>
      <p className={`font-mono text-[10px] tracking-[0.3em] uppercase ${t.textDim}`}>
        {label}
      </p>
      <h2 className={`mt-2 font-mono text-xl font-bold tracking-wider ${t.text}`}>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Quiz Question Card                                                  */
/* ------------------------------------------------------------------ */

interface QuizQuestionCardProps {
  question: SessionQuestion;
  selectedAnswer: string | null;
  onSelect: (key: string) => void;
  isDark: boolean;
}

function QuizQuestionCard({ question, selectedAnswer, onSelect, isDark }: Readonly<QuizQuestionCardProps>) {
  const t = themeTokens(isDark);
  const options = [
    { key: "a", text: question.option_a },
    { key: "b", text: question.option_b },
    { key: "c", text: question.option_c },
    { key: "d", text: question.option_d },
  ];

  return (
    <BrutalistCard isDark={isDark}>
      <p className={`font-mono text-[10px] tracking-[0.25em] uppercase ${t.textDim}`}>
        QUESTION {question.question_number}
      </p>
      <p className={`mt-2 font-mono text-sm font-bold ${t.text} tracking-wider leading-relaxed`}>
        {question.question_text}
      </p>

      <div className="mt-4 space-y-2">
        {options.map((opt) => {
          const isSelected = opt.key === selectedAnswer;

          return (
            <button
              key={opt.key}
              onClick={() => onSelect(opt.key)}
              className={`flex w-full cursor-pointer items-center gap-3 border p-4 transition-all duration-200 ${
                isSelected
                  ? `${t.borderFull} ${t.cardBg}`
                  : `${t.border} ${isDark ? 'hover:border-white/30' : 'hover:border-black/25'}`
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center border font-mono text-xs font-bold transition-colors ${
                  isSelected
                    ? `${t.borderFull} ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`
                    : `${t.borderMid} ${t.text}`
                }`}
              >
                {opt.key.toUpperCase()}
              </span>
              <span className={`text-left font-mono text-sm ${t.textMid}`}>{opt.text}</span>
            </button>
          );
        })}
      </div>
    </BrutalistCard>
  );
}

/* ------------------------------------------------------------------ */
/*  Result Question Card                                                */
/* ------------------------------------------------------------------ */

interface ResultQuestionCardProps {
  question: SessionQuestion;
  selected: string | null;
  isCorrect: boolean;
  isDark: boolean;
}

function ResultQuestionCard({ question, selected, isCorrect, isDark }: Readonly<ResultQuestionCardProps>) {
  const t = themeTokens(isDark);
  const options = [
    { key: "a", text: question.option_a },
    { key: "b", text: question.option_b },
    { key: "c", text: question.option_c },
    { key: "d", text: question.option_d },
  ];

  return (
    <BrutalistCard isDark={isDark}>
      <div className="flex items-center justify-between">
        <p className={`font-mono text-[10px] tracking-[0.25em] uppercase ${t.textDim}`}>
          QUESTION {question.question_number}
        </p>
        <BrutalistBadge isDark={isDark} variant={isCorrect ? "success" : "error"}>
          {isCorrect ? "CORRECT" : "INCORRECT"}
        </BrutalistBadge>
      </div>
      <p className={`mt-2 font-mono text-sm font-bold ${t.text} tracking-wider leading-relaxed`}>
        {question.question_text}
      </p>

      <div className="mt-4 space-y-2">
        {options.map((opt) => {
          const isThisCorrect = opt.key === question.correct_answer;
          const isThisSelected = opt.key === selected;

          let borderClass = t.border;
          let bgClass = "";
          let letterBorder = t.borderMid;
          let letterBg = "";
          let letterText = t.text;
          let opacity = "";

          if (isThisCorrect) {
            borderClass = isDark ? 'border-green-500/50' : 'border-green-600/50';
            bgClass = isDark ? 'bg-green-500/10' : 'bg-green-50';
            letterBorder = isDark ? 'border-green-400' : 'border-green-600';
            letterBg = isDark ? 'bg-green-500' : 'bg-green-600';
            letterText = 'text-white';
          } else if (isThisSelected && !isThisCorrect) {
            borderClass = isDark ? 'border-red-500/50' : 'border-red-600/50';
            bgClass = isDark ? 'bg-red-500/10' : 'bg-red-50';
            letterBorder = isDark ? 'border-red-400' : 'border-red-600';
            letterBg = isDark ? 'bg-red-500' : 'bg-red-600';
            letterText = 'text-white';
          } else {
            opacity = 'opacity-40';
          }

          return (
            <div key={opt.key} className={`flex w-full items-center gap-3 border ${borderClass} ${bgClass} p-4 ${opacity}`}>
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center border ${letterBorder} ${letterBg} font-mono text-xs font-bold ${letterText}`}>
                {opt.key.toUpperCase()}
              </span>
              <span className={`text-left font-mono text-sm ${t.textMid}`}>{opt.text}</span>
            </div>
          );
        })}
      </div>

      {question.explanation && (
        <div className={`mt-4 border ${t.border} ${t.cardBg} p-4`}>
          <p className={`font-mono text-xs font-bold ${t.text} tracking-wider`}>EXPLANATION</p>
          <p className={`mt-1 font-mono text-sm ${t.textMid} leading-relaxed`}>
            {question.explanation}
          </p>
        </div>
      )}
    </BrutalistCard>
  );
}
