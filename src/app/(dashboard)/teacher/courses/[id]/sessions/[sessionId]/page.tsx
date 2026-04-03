"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AudioPlayer } from "@/components";
import { useDashboardTheme } from "@/app/(dashboard)/teacher/dashboard-theme-context";
import type {
  PrimingSession,
  PrimingSessionContent,
  SessionQuestion,
} from "@/lib/types/priming-session";

interface SessionDetail extends PrimingSession {
  material: { file_name: string };
  course: { title: string; course_code: string };
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

export default function SessionDetailPage() {
  const { isDark } = useDashboardTheme();
  const { id: courseId, sessionId } = useParams<{
    id: string;
    sessionId: string;
  }>();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [questions, setQuestions] = useState<SessionQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);

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
            href={`/teacher/courses/${courseId}`}
            className={`inline-block font-mono text-xs border ${isDark ? 'border-white' : 'border-black'} px-5 py-2.5 ${isDark ? 'hover:bg-white hover:text-black' : 'hover:bg-black hover:text-white'} transition-all duration-200`}
          >
            ← BACK TO COURSE
          </Link>
        </div>
      </div>
    );
  }

  const content = session.content as PrimingSessionContent | null;

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
          href={`/teacher/courses/${courseId}`}
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
        <div className="mb-10 relative">
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

          <h1 className={`font-mono font-bold text-2xl lg:text-4xl ${text} tracking-wider leading-tight mb-3`}>
            {session.title}
          </h1>
          <p className={`font-mono text-xs ${textDim} tracking-wider`}>
            GENERATED {new Date(session.created_at).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
            }).toUpperCase()}
          </p>
        </div>

        {/* Audio section */}
        {session.status === "completed" && (
          <div className="mb-12">
            {session.audio_status === "ready" && session.audio_url ? (
              <div>
                <div className={`font-mono text-[10px] tracking-[0.3em] uppercase ${textDim} mb-4`}>AUDIO NARRATION</div>
                <AudioPlayer src={session.audio_url} isDark={isDark} />
              </div>
            ) : (
              <div className={`relative border ${border} p-6 ${cardBg}`}>
                <div className={`absolute top-0 left-0 w-3 h-3 border-t border-l ${borderMid}`} />
                <div className={`font-mono text-[10px] tracking-[0.3em] uppercase ${textDim} mb-4`}>AUDIO NARRATION</div>
                <button
                  onClick={handleGenerateAudio}
                  disabled={isGeneratingAudio || session.audio_status === "generating"}
                  className={`relative font-mono text-sm ${text} border ${isDark ? 'border-white' : 'border-black'} px-6 py-2.5 ${isDark ? 'hover:bg-white hover:text-black' : 'hover:bg-black hover:text-white'} transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${isDark ? 'disabled:hover:bg-transparent disabled:hover:text-white' : 'disabled:hover:bg-transparent disabled:hover:text-black'} group`}
                >
                  {!isGeneratingAudio && session.audio_status !== "generating" && (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      className="inline mr-2"
                    >
                      <path d="M9 18V5l12-2v13" />
                      <circle cx="6" cy="18" r="3" />
                      <circle cx="18" cy="16" r="3" />
                    </svg>
                  )}
                  {isGeneratingAudio || session.audio_status === "generating"
                    ? "GENERATING AUDIO..."
                    : "GENERATE AUDIO VERSION"}
                </button>
                {session.audio_status === "failed" && (
                  <p className="mt-3 font-mono text-xs text-red-600 tracking-wider">
                    AUDIO GENERATION FAILED. TRY AGAIN.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Content sections */}
        {content && (
          <div className="space-y-16">
            {/* Introduction */}
            <ContentSection label="INTRODUCTION" title={content.introduction.title} isDark={isDark}>
              <div className={`space-y-4 font-mono text-sm ${textMid} leading-relaxed`}>
                {content.introduction.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </ContentSection>

            {/* Key Terms */}
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

            {/* Core Concepts */}
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

            {/* Lecture Preview */}
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
          </div>
        )}

        {/* Quiz Questions */}
        {questions.length > 0 && (
          <div className="mt-20 mb-12">
            <div className={`mb-10 text-center border-t border-b ${border} py-8`}>
              <div className="flex items-center justify-center gap-2 mb-3 opacity-60">
                <div className={`w-8 h-px ${line}`} />
                <span className={`font-mono text-[10px] ${textMid} tracking-wider`}>002</span>
                <div className={`flex-1 h-px ${line}`} />
                <span className={`font-mono text-[10px] ${textDim} tracking-[0.3em] uppercase`}>QUIZ PREVIEW</span>
                <div className={`flex-1 h-px ${line}`} />
                <span className={`font-mono text-[10px] ${textMid} tracking-wider`}>002</span>
                <div className={`w-8 h-px ${line}`} />
              </div>
              <h2 className={`font-mono font-bold text-2xl ${text} tracking-wider`}>
                CHECK YOUR UNDERSTANDING
              </h2>
              <p className={`mt-2 font-mono text-xs ${textMid} tracking-wider`}>
                {questions.length} QUESTIONS GENERATED FROM THIS MATERIAL
              </p>
            </div>

            <div className="space-y-4">
              {questions.map((q) => (
                <QuestionCard key={q.id} question={q} isDark={isDark} />
              ))}
            </div>
          </div>
        )}

        {/* Bottom spacer */}
        <div className="h-16" />
      </div>
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
/*  Question Card                                                       */
/* ------------------------------------------------------------------ */

interface QuestionCardProps {
  question: SessionQuestion;
  isDark: boolean;
}

function QuestionCard({ question, isDark }: Readonly<QuestionCardProps>) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

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

  const handleSelect = (key: string) => {
    if (revealed) return;
    setSelectedAnswer(key);
  };

  const handleReveal = () => {
    if (!selectedAnswer) return;
    setRevealed(true);
  };

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
          const isCorrect = opt.key === question.correct_answer;
          const isSelected = opt.key === selectedAnswer;

          let optionClasses = "flex cursor-pointer items-center gap-3 border p-4 transition-all";
          let letterClasses = "flex h-8 w-8 shrink-0 items-center justify-center border font-mono text-xs font-bold transition-all";
          let textClasses = "text-left font-mono text-sm";

          if (revealed) {
            if (isCorrect) {
              optionClasses += ` border-green-600 ${isDark ? 'bg-green-900/30' : 'bg-green-50'}`;
              letterClasses += " border-green-600 bg-green-600 text-white";
              textClasses += isDark ? " text-green-100" : " text-green-900";
            } else if (isSelected && !isCorrect) {
              optionClasses += ` border-red-600 ${isDark ? 'bg-red-900/30' : 'bg-red-50'}`;
              letterClasses += " border-red-600 bg-red-600 text-white";
              textClasses += isDark ? " text-red-100" : " text-red-900";
            } else {
              optionClasses += ` ${isDark ? 'border-white/10' : 'border-black/10'} bg-transparent opacity-50`;
              letterClasses += ` ${isDark ? 'border-white/20' : 'border-black/20'} bg-transparent ${isDark ? 'text-white/40' : 'text-black/40'}`;
              textClasses += ` ${textMid}`;
            }
          } else if (isSelected) {
            optionClasses += ` ${isDark ? 'border-white' : 'border-black'} ${isDark ? 'bg-black' : 'bg-white'}`;
            letterClasses += ` ${isDark ? 'border-white bg-white text-black' : 'border-black bg-black text-white'}`;
            textClasses += ` ${textMid}`;
          } else {
            optionClasses += ` ${isDark ? 'border-white/15 hover:border-white/40' : 'border-black/15 hover:border-black/40'} bg-transparent`;
            letterClasses += ` ${isDark ? 'border-white/30' : 'border-black/30'} bg-transparent ${isDark ? 'text-white/60' : 'text-black/60'}`;
            textClasses += ` ${textMid}`;
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
              <span className={textClasses}>{opt.text}</span>
            </button>
          );
        })}
      </div>

      {!revealed && (
        <button
          className={`mt-6 w-full font-mono text-sm ${text} border ${isDark ? 'border-white' : 'border-black'} px-6 py-2.5 ${isDark ? 'hover:bg-white hover:text-black' : 'hover:bg-black hover:text-white'} transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${isDark ? 'disabled:hover:bg-transparent disabled:hover:text-white' : 'disabled:hover:bg-transparent disabled:hover:text-black'}`}
          disabled={!selectedAnswer}
          onClick={handleReveal}
        >
          CHECK ANSWER
        </button>
      )}

      {revealed && question.explanation && (
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
