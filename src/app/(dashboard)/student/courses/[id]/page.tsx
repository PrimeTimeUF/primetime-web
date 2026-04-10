"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useDashboardTheme } from "../../../teacher/dashboard-theme-context";
import { SectionLabel, BrutalistCard, BrutalistButton, BrutalistBadge, BrutalistTab, themeTokens } from "@/components/ui/dashboard-primitives";
import type { StudentCourseDetail, StudentCourseProgress } from "@/lib/types/student-course";
import type { StudentAssignmentView } from "@/lib/types/session-assignment";

type FilterKey = "all" | "upcoming" | "completed";

export default function StudentCourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isDark } = useDashboardTheme();
  const t = themeTokens(isDark);

  const [course, setCourse] = useState<StudentCourseDetail | null>(null);
  const [assignments, setAssignments] = useState<StudentAssignmentView[]>([]);
  const [progress, setProgress] = useState<StudentCourseProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  const fetchCourse = useCallback(async () => {
    try {
      const res = await fetch(`/api/courses/${id}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to load course.");
        return;
      }
      const data = await res.json();
      setCourse(data.course);
    } catch {
      setError("Something went wrong. Please try again.");
    }
  }, [id]);

  const fetchAssignments = useCallback(async () => {
    try {
      const res = await fetch(`/api/courses/${id}/assignments`);
      if (res.ok) {
        const data = await res.json();
        setAssignments(data.assignments || []);
        setProgress(data.progress || null);
      }
    } catch (err) {
      console.error("Failed to fetch assignments:", err);
    }
  }, [id]);

  useEffect(() => {
    async function loadData() {
      await Promise.all([fetchCourse(), fetchAssignments()]);
      setIsLoading(false);
    }
    loadData();
  }, [fetchCourse, fetchAssignments]);

  const filteredAssignments = assignments.filter((a) => {
    if (filter === "all") return true;
    if (filter === "completed") return a.completion !== null;
    if (filter === "upcoming") return a.completion === null;
    return true;
  });

  const formatDueDate = (dateString: string) => {
    return new Date(dateString + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const isDueSoon = (dateString: string) => {
    const due = new Date(dateString + "T23:59:59");
    const now = new Date();
    const diffDays = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 2 && diffDays >= 0;
  };

  const isOverdue = (dateString: string) => {
    const due = new Date(dateString + "T23:59:59");
    return new Date() > due;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className={`font-mono text-sm ${t.textMid}`}>LOADING COURSE...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className={`font-mono text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
        <Link
          href="/student"
          className={`mt-4 font-mono text-xs tracking-wider ${t.textMid} ${isDark ? 'hover:text-white' : 'hover:text-black'}`}
        >
          BACK TO DASHBOARD
        </Link>
      </div>
    );
  }

  if (!course) return null;

  return (
    <>
      {/* Back link */}
      <Link
        href="/student"
        className={`mb-6 inline-flex items-center gap-2 font-mono text-xs tracking-wider ${t.textMid} transition-colors ${isDark ? 'hover:text-white' : 'hover:text-black'}`}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 12L6 8l4-4" />
        </svg>
        BACK
      </Link>

      <SectionLabel num="002" label="COURSE DETAIL" isDark={isDark} />

      {/* Course Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 sm:gap-4 mb-2">
          <div className={`flex h-11 w-11 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center border ${t.border} font-mono text-[10px] sm:text-xs font-bold ${t.text}`}>
            {course.course_code.substring(0, 3)}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className={`font-mono text-xl sm:text-2xl font-bold tracking-wider ${t.text} break-words`}>
              {course.title}
            </h1>
            <div className={`mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 sm:gap-4 font-mono text-xs ${t.textMid} tracking-wider`}>
              <span>{course.course_code}</span>
              <span className={`w-1 h-1 ${isDark ? 'bg-white/30' : 'bg-black/30'} rounded-full`} />
              <span>{course.semester}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        {/* Main Column */}
        <div className="min-w-0">
          {/* Course Overview */}
          <BrutalistCard isDark={isDark} className="mb-6">
            <h2 className={`font-mono text-xs tracking-[0.3em] uppercase ${t.textMid} mb-4`}>OVERVIEW</h2>
            {course.description && (
              <p className={`font-mono text-sm ${t.textMid} leading-relaxed mb-4`}>
                {course.description}
              </p>
            )}
            <div className={`flex items-center gap-3 border ${t.border} p-4`}>
              <div className={`flex h-10 w-10 items-center justify-center border ${t.borderDim} font-mono text-xs font-bold ${t.text} overflow-hidden`}>
                {course.teacher_profile_image_url ? (
                  <img src={course.teacher_profile_image_url} alt={course.teacher_name} className="w-full h-full object-cover" />
                ) : (
                  getInitials(course.teacher_name)
                )}
              </div>
              <div>
                <p className={`font-mono text-[10px] ${t.textDim} tracking-[0.25em] uppercase`}>INSTRUCTOR</p>
                <p className={`font-mono text-sm font-medium ${t.text} tracking-wider`}>{course.teacher_name}</p>
              </div>
            </div>
          </BrutalistCard>

          {/* Priming Sessions */}
          <BrutalistCard isDark={isDark}>
            <div className="mb-6 flex items-center justify-between">
              <h2 className={`font-mono text-xs tracking-[0.3em] uppercase ${t.textMid}`}>PRIMING SESSIONS</h2>
            </div>

            {/* Filter Tabs */}
            <div className={`flex gap-0 border-b ${t.border} mb-6 overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0`}>
              {(["all", "upcoming", "completed"] as FilterKey[]).map((key) => (
                <BrutalistTab
                  key={key}
                  isDark={isDark}
                  label={key.toUpperCase()}
                  active={filter === key}
                  onClick={() => setFilter(key)}
                  count={
                    key === "all" ? assignments.length
                      : key === "completed" ? assignments.filter(a => a.completion !== null).length
                      : assignments.filter(a => a.completion === null).length
                  }
                />
              ))}
            </div>

            {filteredAssignments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <svg
                  className={`w-16 h-16 ${t.textDim} mb-6`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                <h3 className={`font-mono text-lg font-bold ${t.text} tracking-wider`}>
                  {filter === "all"
                    ? "NO SESSIONS ASSIGNED"
                    : filter === "upcoming"
                      ? "NO UPCOMING SESSIONS"
                      : "NO COMPLETED SESSIONS"}
                </h3>
                <p className={`mt-2 font-mono text-sm ${t.textMid}`}>
                  {filter === "all"
                    ? "Your teacher hasn't assigned any priming sessions yet."
                    : filter === "upcoming"
                      ? "You're all caught up!"
                      : "Complete a priming session to see it here."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAssignments.map((assignment) => {
                  const isCompleted = assignment.completion !== null;
                  const overdue = !isCompleted && isOverdue(assignment.due_date);

                  return (
                    <div
                      key={assignment.id}
                      className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 border ${t.border} ${t.cardBg} p-4 sm:p-5 transition-all duration-200 ${
                        isCompleted
                          ? 'opacity-60 hover:opacity-100'
                          : `sm:hover:-translate-y-0.5 ${isDark ? 'hover:border-white/30' : 'hover:border-black/25'}`
                      }`}
                    >
                      {/* Icon + details (row on mobile, left side on desktop) */}
                      <div className="flex items-start gap-3 sm:items-center sm:gap-4 sm:flex-1 min-w-0">
                        {/* Session icon */}
                        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center border font-mono text-xs ${
                          isCompleted
                            ? isDark ? 'border-green-500/40 text-green-400' : 'border-green-600/50 text-green-600'
                            : `${t.border} ${t.text}`
                        }`}>
                          {isCompleted ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                            </svg>
                          )}
                        </div>

                        {/* Session details */}
                        <div className="flex-1 min-w-0">
                          <p className={`font-mono text-sm font-bold ${t.text} tracking-wider break-words`}>
                            {assignment.session.title || "Untitled Session"}
                          </p>
                          <div className={`mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 sm:gap-4 font-mono text-xs ${t.textDim}`}>
                            <span className="flex items-center gap-1.5">
                              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <circle cx="6" cy="6" r="4" />
                                <path d="M6 3v3l2 1" />
                              </svg>
                              {formatDueDate(assignment.due_date)}
                            </span>
                            {assignment.session.lecture_name && (
                              <span className="flex items-center gap-1.5 min-w-0">
                                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="flex-shrink-0">
                                  <rect x="2" y="2" width="8" height="8" rx="1" />
                                  <path d="M2 5h8" />
                                </svg>
                                <span className="truncate">{assignment.session.lecture_name}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status + Action (bottom row on mobile, right side on desktop) */}
                      <div className="flex items-center gap-3 sm:flex-shrink-0">
                        {isCompleted ? (
                          <>
                            <BrutalistBadge isDark={isDark} variant="success">COMPLETED</BrutalistBadge>
                            <Link
                              href={`/student/courses/${id}/sessions/${assignment.session_id}?review=true`}
                              className="flex-1 sm:flex-none"
                            >
                              <BrutalistButton isDark={isDark} variant="secondary" size="sm" className="w-full sm:w-auto">
                                REVIEW
                              </BrutalistButton>
                            </Link>
                          </>
                        ) : (
                          <>
                            <BrutalistBadge isDark={isDark} variant={overdue ? "error" : "warning"}>
                              {overdue ? "OVERDUE" : "UPCOMING"}
                            </BrutalistBadge>
                            <Link
                              href={`/student/courses/${id}/sessions/${assignment.session_id}`}
                              className="flex-1 sm:flex-none"
                            >
                              <BrutalistButton isDark={isDark} size="sm" className="w-full sm:w-auto">
                                START
                              </BrutalistButton>
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </BrutalistCard>
        </div>

        {/* Sidebar */}
        <aside className="lg:sticky lg:top-[120px] lg:h-fit space-y-6">
          {/* Progress Card */}
          <BrutalistCard isDark={isDark}>
            <h3 className={`font-mono text-xs tracking-[0.3em] uppercase ${t.textMid} mb-5`}>YOUR PROGRESS</h3>

            {progress ? (
              <>
                {/* Completion bar */}
                <div className="mb-5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className={`font-mono text-[10px] ${t.textDim} tracking-wider uppercase`}>COMPLETION</span>
                    <span className={`font-mono text-xs font-bold ${t.text}`}>{progress.completion_percentage}%</span>
                  </div>
                  <div className={`h-1 ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
                    <div
                      className={`h-full ${isDark ? 'bg-white' : 'bg-black'} transition-all duration-500`}
                      style={{ width: `${progress.completion_percentage}%` }}
                    />
                  </div>
                </div>

                {/* Sessions bar */}
                <div className="mb-5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className={`font-mono text-[10px] ${t.textDim} tracking-wider uppercase`}>SESSIONS</span>
                    <span className={`font-mono text-xs font-bold ${t.text}`}>{progress.completed_count}/{progress.total_assigned}</span>
                  </div>
                  <div className={`h-1 ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
                    <div
                      className={`h-full ${isDark ? 'bg-white' : 'bg-black'} transition-all duration-500`}
                      style={{ width: progress.total_assigned > 0 ? `${(progress.completed_count / progress.total_assigned) * 100}%` : "0%" }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className={`grid grid-cols-2 gap-4 border-t ${t.border} pt-5`}>
                  <div className="text-center">
                    <p className={`font-mono text-2xl font-bold ${t.text}`}>{progress.average_score}%</p>
                    <p className={`font-mono text-[10px] ${t.textDim} tracking-[0.2em] uppercase`}>AVG SCORE</p>
                  </div>
                  <div className="text-center">
                    <p className={`font-mono text-2xl font-bold ${t.text}`}>{progress.completed_count}</p>
                    <p className={`font-mono text-[10px] ${t.textDim} tracking-[0.2em] uppercase`}>DONE</p>
                  </div>
                </div>
              </>
            ) : (
              <p className={`font-mono text-sm ${t.textMid}`}>No progress data yet.</p>
            )}
          </BrutalistCard>

          {/* Quick Links */}
          <BrutalistCard isDark={isDark}>
            <h3 className={`font-mono text-xs tracking-[0.3em] uppercase ${t.textMid} mb-4`}>QUICK LINKS</h3>
            <Link
              href="/student"
              className={`flex items-center gap-3 border ${t.border} p-3 font-mono text-xs font-medium ${t.text} tracking-wider transition-all ${isDark ? 'hover:border-white/30' : 'hover:border-black/25'}`}
            >
              <span className={`flex h-8 w-8 items-center justify-center border ${t.border} font-mono text-[10px] ${t.textMid}`}>
                &lt;-
              </span>
              <span className="flex-1">MY DASHBOARD</span>
              <span className={`${t.textDim}`}>&rarr;</span>
            </Link>
          </BrutalistCard>
        </aside>
      </div>
    </>
  );
}
