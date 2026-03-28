"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AudioPlayer } from "@/components";
import type {
  PrimingSession,
  PrimingSessionContent,
  SessionQuestion,
} from "@/lib/types/priming-session";

// For now, we'll use a simple local dark mode state
// TODO: Integrate with global theme context when student layout gets updated
const useDarkMode = () => {
  const [isDark, setIsDark] = useState(true);
  return { isDark, toggle: () => setIsDark(d => !d) };
};

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

// ─── Scroll-reveal hook ───────────────────────────────────────────────────────
function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

export default function StudentSessionPage() {
  const { isDark } = useDarkMode();
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

  // Theme tokens
  const bg = isDark ? 'bg-black' : 'bg-white';
  const text = isDark ? 'text-white' : 'text-black';
  const textMid = isDark ? 'text-white/60' : 'text-black/50';
  const textDim = isDark ? 'text-white/40' : 'text-black/35';
  const border = isDark ? 'border-white/15' : 'border-black/12';
  const borderMid = isDark ? 'border-white/30' : 'border-black/25';
  const cardBg = isDark ? 'bg-white/[0.03]' : 'bg-black/[0.02]';
  const line = isDark ? 'bg-white/40' : 'bg-black/25';
  const hoverBorder = isDark ? 'hover:border-white/20' : 'hover:border-black/20';

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
      <div className={`min-h-screen ${bg} flex items-center justify-center transition-colors duration-500`}>
        <div className="text-center">
          <div className="flex gap-1 mb-4 justify-center">
            <div className={`w-1 h-1 ${isDark ? 'bg-white/60' : 'bg-black/60'} rounded-full animate-pulse`} />
            <div className={`w-1 h-1 ${isDark ? 'bg-white/40' : 'bg-black/40'} rounded-full animate-pulse`} style={{ animationDelay: '0.2s' }} />
            <div className={`w-1 h-1 ${isDark ? 'bg-white/20' : 'bg-black/20'} rounded-full animate-pulse`} style={{ animationDelay: '0.4s' }} />
          </div>
          <p className={`font-mono text-xs ${textMid} tracking-wider`}>LOADING SESSION...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className={`min-h-screen ${bg} flex items-center justify-center transition-colors duration-500`}>
        <div className={`relative text-center border ${border} p-12 max-w-md`}>
          <div className={`absolute top-0 left-0 w-4 h-4 border-t border-l ${borderMid}`} />
          <div className={`absolute bottom-0 right-0 w-4 h-4 border-b border-r ${borderMid}`} />
          <p className="font-mono text-xs text-red-600 mb-6 tracking-wider">{error || "SESSION NOT FOUND"}</p>
          <Link
            href={`/student/courses/${courseId}`}
            className={`inline-block font-mono text-xs border ${isDark ? 'border-white' : 'border-black'} px-5 py-2.5 ${isDark ? 'hover:bg-white hover:text-black' : 'hover:bg-black hover:text-white'} transition-all duration-200`}
          >
            ← BACK TO COURSE
          </Link>
        </div>
      </div>
    );
  }

  const content = session.content as PrimingSessionContent | null;
  const scorePercentage =
    totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  // Build a map from question id to result for the results phase
  const resultMap = new Map(quizResults.map((r) => [r.question_id, r]));

  return (
    <div className={`min-h-screen ${bg} transition-colors duration-500`}>
      {/* Corner Frame Accents */}
      <div className={`fixed top-0 left-0 w-8 h-8 lg:w-12 lg:h-12 border-t-2 border-l-2 ${borderMid} z-20 pointer-events-none`} />
      <div className={`fixed top-0 right-0 w-8 h-8 lg:w-12 lg:h-12 border-t-2 border-r-2 ${borderMid} z-20 pointer-events-none`} />
      <div className={`fixed bottom-0 left-0 w-8 h-8 lg:w-12 lg:h-12 border-b-2 border-l-2 ${borderMid} z-20 pointer-events-none`} />
      <div className={`fixed bottom-0 right-0 w-8 h-8 lg:w-12 lg:h-12 border-b-2 border-r-2 ${borderMid} z-20 pointer-events-none`} />

      <div className="container mx-auto px-6 lg:px-16 py-12 lg:py-20 max-w-4xl">
        {/* Back link */}
        <Link
          href={`/student/courses/${courseId}`}
          className={`inline-flex items-center gap-2 font-mono text-xs ${textMid} ${isDark ? 'hover:text-white' : 'hover:text-black'} transition-colors mb-8`}
        >
          <svg
            width="12"
            height="12"
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
          BACK TO COURSE
        </Link>

        {/* Session header */}
        <div className="mb-8 relative">
          {/* Decorative top line */}
          <div className="flex items-center gap-2 mb-4 opacity-60">
            <div className={`w-8 h-px ${line}`} />
            <span className={`${textMid} font-mono text-[10px] tracking-wider`}>001</span>
            <div className={`flex-1 h-px ${line}`} />
            <span className={`${textDim} font-mono text-[10px] tracking-[0.3em] uppercase`}>
              {session.course?.course_code} · {session.material?.file_name}
            </span>
            <div className={`w-4 h-px ${line}`} />
          </div>

          <h1 className={`font-mono font-bold text-2xl lg:text-4xl ${text} tracking-wider leading-tight`}>
            {session.title}
          </h1>
        </div>

        {/* Phase indicator */}
        <div className="flex items-center gap-2 mb-10">
          {(["reading", "quiz", "results"] as Phase[]).map((p, i) => (
            <div key={p} className="flex items-center gap-2">
              {i > 0 && <div className={`h-px w-8 ${isDark ? 'bg-white/15' : 'bg-black/15'}`} />}
              <div
                className={`flex items-center gap-2 border px-3 py-1.5 font-mono text-[10px] tracking-wider transition-all ${
                  phase === p
                    ? `${isDark ? 'border-white bg-white text-black' : 'border-black bg-black text-white'}`
                    : phases.indexOf(phase) > i
                      ? `${isDark ? 'border-white/20 bg-white/5 text-white/50' : 'border-black/20 bg-black/5 text-black/50'}`
                      : `${isDark ? 'border-white/10 bg-transparent text-white/30' : 'border-black/10 bg-transparent text-black/30'}`
                }`}
              >
                <span className="font-bold">{String(i + 1).padStart(2, '0')}</span>
                <span className="uppercase">{p}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Audio Player (reading phase only, when audio is ready) ── */}
        {phase === "reading" && session.audio_status === "ready" && session.audio_url && (
          <div className="mb-10">
            <AudioPlayer src={session.audio_url} isDark={isDark} />
          </div>
        )}

        {/* ── Reading Phase ── */}
        {phase === "reading" && content && (
          <div className="space-y-16">
            <ContentSection label="INTRODUCTION" title={content.introduction.title} isDark={isDark}>
              <div className={`space-y-4 font-mono text-sm ${textMid} leading-relaxed`}>
                {content.introduction.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </ContentSection>

            <ContentSection label="KEY TERMS" title="Essential Vocabulary" isDark={isDark}>
              <div className="space-y-3">
                {content.keyTerms.map((term, i) => (
                  <div
                    key={i}
                    className={`relative border ${border} ${cardBg} p-6 group ${hoverBorder} transition-colors`}
                  >
                    <div className={`absolute top-0 left-0 w-2 h-full ${isDark ? 'bg-white' : 'bg-black'}`} />
                    <div className="pl-4">
                      <p className={`font-mono font-bold text-base ${text} tracking-wider`}>
                        {term.term}
                      </p>
                      <p className={`mt-2 font-mono text-sm ${textMid} leading-relaxed`}>
                        {term.definition}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ContentSection>

            <ContentSection label="CORE CONCEPTS" title="Key Ideas" isDark={isDark}>
              <div className="space-y-6">
                {content.coreConcepts.map((concept, i) => (
                  <div key={i} className="flex gap-4">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center border-2 ${isDark ? 'border-white' : 'border-black'} bg-transparent font-mono text-sm font-bold ${text}`}>
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-mono font-bold text-base ${text} tracking-wider`}>
                        {concept.title}
                      </h3>
                      <p className={`mt-2 font-mono text-sm ${textMid} leading-relaxed`}>
                        {concept.explanation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ContentSection>

            <ContentSection
              label="WHAT TO EXPECT"
              title={content.lecturePreview.title}
              isDark={isDark}
            >
              <div className={`space-y-4 font-mono text-sm ${textMid} leading-relaxed`}>
                {content.lecturePreview.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </ContentSection>

            {questions.length > 0 && (
              <div className="flex justify-center pt-8 pb-12">
                <button
                  onClick={() => setPhase("quiz")}
                  className={`relative font-mono text-sm ${text} border-2 ${isDark ? 'border-white' : 'border-black'} px-8 py-3 ${isDark ? 'hover:bg-white hover:text-black' : 'hover:bg-black hover:text-white'} transition-all duration-200 group`}
                >
                  <span className={`absolute -top-1 -left-1 w-2.5 h-2.5 border-t border-l ${isDark ? 'border-white' : 'border-black'} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  <span className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b border-r ${isDark ? 'border-white' : 'border-black'} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  START QUIZ ({questions.length} QUESTIONS) →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Quiz Phase ── */}
        {phase === "quiz" && (
          <div>
            <div className={`mb-10 text-center border-t border-b ${border} py-8`}>
              <div className="flex items-center justify-center gap-2 mb-3 opacity-60">
                <div className={`w-8 h-px ${line}`} />
                <span className={`font-mono text-[10px] ${textMid} tracking-wider`}>002</span>
                <div className={`flex-1 h-px ${line}`} />
                <span className={`font-mono text-[10px] ${textDim} tracking-[0.3em] uppercase`}>QUIZ</span>
                <div className={`flex-1 h-px ${line}`} />
                <span className={`font-mono text-[10px] ${textMid} tracking-wider`}>002</span>
                <div className={`w-8 h-px ${line}`} />
              </div>
              <h2 className={`font-mono font-bold text-2xl ${text} tracking-wider`}>
                CHECK YOUR UNDERSTANDING
              </h2>
              <p className={`mt-2 font-mono text-xs ${textMid} tracking-wider`}>
                ANSWER ALL {questions.length} QUESTIONS, THEN SUBMIT.
              </p>
            </div>

            <div className="space-y-4">
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

            <div className="mt-10 flex justify-center pb-12">
              <button
                disabled={!allAnswered || isSubmitting}
                onClick={handleSubmitQuiz}
                className={`relative font-mono text-sm ${text} border-2 ${isDark ? 'border-white' : 'border-black'} px-8 py-3 ${isDark ? 'hover:bg-white hover:text-black' : 'hover:bg-black hover:text-white'} transition-all duration-200 group disabled:opacity-40 disabled:cursor-not-allowed ${isDark ? 'disabled:hover:bg-transparent disabled:hover:text-white' : 'disabled:hover:bg-transparent disabled:hover:text-black'}`}
              >
                <span className={`absolute -top-1 -left-1 w-2.5 h-2.5 border-t border-l ${isDark ? 'border-white' : 'border-black'} opacity-0 group-hover:opacity-100 transition-opacity`} />
                <span className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b border-r ${isDark ? 'border-white' : 'border-black'} opacity-0 group-hover:opacity-100 transition-opacity`} />
                {isSubmitting ? "SUBMITTING..." : "SUBMIT QUIZ →"}
              </button>
            </div>
          </div>
        )}

        {/* ── Results Phase ── */}
        {phase === "results" && (
          <div>
            {/* Score Banner */}
            <div
              className={`relative mb-12 p-10 text-center border-2 ${
                scorePercentage >= 70
                  ? "border-green-600 bg-green-50"
                  : scorePercentage >= 50
                    ? "border-amber-600 bg-amber-50"
                    : "border-red-600 bg-red-50"
              }`}
            >
              <div className={`absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 ${scorePercentage >= 70 ? "border-green-600" : scorePercentage >= 50 ? "border-amber-600" : "border-red-600"}`} />
              <div className={`absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 ${scorePercentage >= 70 ? "border-green-600" : scorePercentage >= 50 ? "border-amber-600" : "border-red-600"}`} />

              <div className="font-mono text-[10px] tracking-[0.3em] uppercase mb-4 text-black/60">
                FINAL SCORE
              </div>
              <p className={`font-mono text-6xl font-bold tracking-wider ${
                scorePercentage >= 70
                  ? "text-green-700"
                  : scorePercentage >= 50
                    ? "text-amber-700"
                    : "text-red-700"
              }`}>
                {score}/{totalQuestions}
              </p>
              <p className="mt-3 font-mono text-sm text-black/70 tracking-wider">
                YOU SCORED {scorePercentage}%
              </p>
            </div>

            {/* Show answered questions with results if we have detailed results */}
            {quizResults.length > 0 && questions.length > 0 && (
              <div className="space-y-4 mb-12">
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

            {/* Review mode without detailed results (just score) */}
            {quizResults.length === 0 && (
              <p className={`text-center font-mono text-xs ${textMid} tracking-wider mb-12`}>
                DETAILED QUESTION RESULTS ARE NOT AVAILABLE FOR REVIEW.
              </p>
            )}

            <div className="flex justify-center pb-12">
              <Link
                href={`/student/courses/${courseId}`}
                className={`relative inline-flex items-center gap-2 font-mono text-sm ${text} border-2 ${isDark ? 'border-white' : 'border-black'} px-8 py-3 ${isDark ? 'hover:bg-white hover:text-black' : 'hover:bg-black hover:text-white'} transition-all duration-200 group`}
              >
                <span className={`absolute -top-1 -left-1 w-2.5 h-2.5 border-t border-l ${isDark ? 'border-white' : 'border-black'} opacity-0 group-hover:opacity-100 transition-opacity`} />
                <span className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b border-r ${isDark ? 'border-white' : 'border-black'} opacity-0 group-hover:opacity-100 transition-opacity`} />
                ← BACK TO COURSE
              </Link>
            </div>
          </div>
        )}

        <div className="h-16" />
      </div>
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

function ContentSection({
  label,
  title,
  children,
  isDark,
}: Readonly<ContentSectionProps>) {
  const line = isDark ? 'bg-white/40' : 'bg-black/25';
  const textDim = isDark ? 'text-white/40' : 'text-black/35';
  const text = isDark ? 'text-white' : 'text-black';

  return (
    <section>
      <div className="flex items-center gap-2 mb-4 opacity-60">
        <div className={`w-8 h-px ${line}`} />
        <span className={`${textDim} font-mono text-[10px] tracking-[0.3em] uppercase`}>{label}</span>
        <div className={`flex-1 h-px ${line}`} />
      </div>
      <h2 className={`font-mono font-bold text-xl lg:text-2xl ${text} tracking-wider leading-tight mb-6`}>
        {title}
      </h2>
      <div>{children}</div>
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
  isDark: boolean;
}

function QuizQuestionCard({
  question,
  selectedAnswer,
  onSelect,
  isDark,
}: Readonly<QuizQuestionCardProps>) {
  const border = isDark ? 'border-white/15' : 'border-black/12';
  const borderMid = isDark ? 'border-white/30' : 'border-black/25';
  const cardBg = isDark ? 'bg-white/[0.03]' : 'bg-black/[0.02]';
  const text = isDark ? 'text-white' : 'text-black';
  const textMid = isDark ? 'text-white/60' : 'text-black/50';
  const textDim = isDark ? 'text-white/40' : 'text-black/35';
  const hoverBorder = isDark ? 'hover:border-white/20' : 'hover:border-black/20';

  const options = [
    { key: "a", text: question.option_a },
    { key: "b", text: question.option_b },
    { key: "c", text: question.option_c },
    { key: "d", text: question.option_d },
  ];

  return (
    <div className={`relative border ${border} ${cardBg} p-6 ${hoverBorder} transition-colors`}>
      <div className={`absolute top-0 left-0 w-3 h-3 border-t border-l ${borderMid}`} />
      <div className={`absolute bottom-0 right-0 w-3 h-3 border-b border-r ${borderMid}`} />

      <p className={`font-mono text-[10px] tracking-[0.3em] uppercase ${textDim} mb-3`}>
        QUESTION {String(question.question_number).padStart(2, '0')}
      </p>
      <p className={`font-mono font-bold text-base ${text} mb-6 leading-relaxed`}>
        {question.question_text}
      </p>

      <div className="space-y-2">
        {options.map((opt) => {
          const isSelected = opt.key === selectedAnswer;

          return (
            <button
              key={opt.key}
              onClick={() => onSelect(opt.key)}
              className={`flex w-full items-center gap-3 border p-4 transition-all ${
                isSelected
                  ? `${isDark ? 'border-white bg-black' : 'border-black bg-white'}`
                  : `${isDark ? 'border-white/15 bg-transparent hover:border-white/40' : 'border-black/15 bg-transparent hover:border-black/40'}`
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center border font-mono text-xs font-bold transition-all ${
                  isSelected
                    ? `${isDark ? 'border-white bg-white text-black' : 'border-black bg-black text-white'}`
                    : `${isDark ? 'border-white/30 bg-transparent text-white/60' : 'border-black/30 bg-transparent text-black/60'}`
                }`}
              >
                {opt.key.toUpperCase()}
              </span>
              <span className={`text-left font-mono text-sm ${textMid}`}>{opt.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Result Question Card (with correct/incorrect coloring)              */
/* ------------------------------------------------------------------ */

interface ResultQuestionCardProps {
  question: SessionQuestion;
  selected: string | null;
  isCorrect: boolean;
  isDark: boolean;
}

function ResultQuestionCard({
  question,
  selected,
  isCorrect,
  isDark,
}: Readonly<ResultQuestionCardProps>) {
  const border = isDark ? 'border-white/15' : 'border-black/12';
  const borderMid = isDark ? 'border-white/30' : 'border-black/25';
  const cardBg = isDark ? 'bg-white/[0.03]' : 'bg-black/[0.02]';
  const text = isDark ? 'text-white' : 'text-black';
  const textMid = isDark ? 'text-white/60' : 'text-black/50';
  const textDim = isDark ? 'text-white/40' : 'text-black/35';

  const options = [
    { key: "a", text: question.option_a },
    { key: "b", text: question.option_b },
    { key: "c", text: question.option_c },
    { key: "d", text: question.option_d },
  ];

  return (
    <div className={`relative border ${border} ${cardBg} p-6`}>
      <div className={`absolute top-0 left-0 w-3 h-3 border-t border-l ${borderMid}`} />
      <div className={`absolute bottom-0 right-0 w-3 h-3 border-b border-r ${borderMid}`} />

      <div className="flex items-center justify-between mb-4">
        <p className={`font-mono text-[10px] tracking-[0.3em] uppercase ${textDim}`}>
          QUESTION {String(question.question_number).padStart(2, '0')}
        </p>
        <span
          className={`px-3 py-1 font-mono text-[9px] tracking-wider border ${
            isCorrect
              ? "border-green-600 bg-green-50 text-green-700"
              : "border-red-600 bg-red-50 text-red-700"
          }`}
        >
          {isCorrect ? "CORRECT" : "INCORRECT"}
        </span>
      </div>

      <p className={`font-mono font-bold text-base ${text} mb-6 leading-relaxed`}>
        {question.question_text}
      </p>

      <div className="space-y-2">
        {options.map((opt) => {
          const isThisCorrect = opt.key === question.correct_answer;
          const isThisSelected = opt.key === selected;

          let optionClasses = "flex w-full items-center gap-3 border p-4";
          let letterClasses = "flex h-8 w-8 shrink-0 items-center justify-center border font-mono text-xs font-bold";

          if (isThisCorrect) {
            optionClasses += " border-green-600 bg-green-50";
            letterClasses += " border-green-600 bg-green-600 text-white";
          } else if (isThisSelected && !isThisCorrect) {
            optionClasses += " border-red-600 bg-red-50";
            letterClasses += " border-red-600 bg-red-600 text-white";
          } else {
            optionClasses += ` ${isDark ? 'border-white/10' : 'border-black/10'} bg-transparent opacity-50`;
            letterClasses += ` ${isDark ? 'border-white/20' : 'border-black/20'} bg-transparent ${isDark ? 'text-white/40' : 'text-black/40'}`;
          }

          return (
            <div key={opt.key} className={optionClasses}>
              <span className={letterClasses}>
                {opt.key.toUpperCase()}
              </span>
              <span className={`text-left font-mono text-sm ${textMid}`}>{opt.text}</span>
            </div>
          );
        })}
      </div>

      {question.explanation && (
        <div className={`mt-6 border ${border} ${cardBg} p-4`}>
          <p className={`font-mono text-[10px] tracking-[0.3em] uppercase ${textDim} mb-2`}>EXPLANATION</p>
          <p className={`font-mono text-sm ${textMid} leading-relaxed`}>
            {question.explanation}
          </p>
        </div>
      )}
    </div>
  );
}
