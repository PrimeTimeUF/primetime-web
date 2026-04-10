"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { TeacherStatsBar } from "@/components";
import { useDashboardTheme } from "../dashboard-theme-context";
import { BrutalistCard, SectionLabel, BrutalistBadge, themeTokens } from "@/components/ui/dashboard-primitives";
import type { TeacherAnalyticsOverview } from "@/lib/types/teacher-analytics";

export default function TeacherAnalyticsPage() {
  const { isDark } = useDashboardTheme();
  const t = themeTokens(isDark);
  const [overview, setOverview] = useState<TeacherAnalyticsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAnalytics = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/teacher/analytics");
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to load analytics.");
        return;
      }
      const data = await res.json();
      setOverview(data.overview);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return (
    <div>
      <SectionLabel num="001" label="ANALYTICS" isDark={isDark} />

      <div className="mb-6 sm:mb-8">
        <h1 className={`font-mono text-xl sm:text-2xl font-bold tracking-wider ${t.text} transition-colors duration-500`}>
          ANALYTICS OVERVIEW
        </h1>
        <p className={`mt-1 font-mono text-xs ${t.textMid} tracking-wider transition-colors duration-500`}>
          Performance across all your courses
        </p>
      </div>

      {error && (
        <div className={`mb-6 border ${isDark ? "border-red-500/40 bg-red-500/10" : "border-red-500/60 bg-red-50"} p-3 font-mono text-xs ${isDark ? "text-red-400" : "text-red-600"}`}>
          {error}
        </div>
      )}

      {isLoading && (
        <p className={`font-mono text-xs ${t.textDim} tracking-wider`}>LOADING ANALYTICS...</p>
      )}

      {!isLoading && !error && overview && overview.courses.length === 0 && (
        <BrutalistCard isDark={isDark} className="flex flex-col items-center justify-center py-16 px-6 text-center border-dashed">
          <div className={`flex h-14 w-14 items-center justify-center border ${t.border} mb-4`}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={t.textMid} aria-hidden="true">
              <path d="M18 20V10" />
              <path d="M12 20V4" />
              <path d="M6 20v-6" />
            </svg>
          </div>
          <h2 className={`font-mono text-sm font-bold ${t.text} tracking-wider`}>NO COURSES YET</h2>
          <p className={`mt-2 max-w-sm font-mono text-xs ${t.textMid} leading-relaxed`}>
            Create a course and assign sessions to start seeing analytics.
          </p>
        </BrutalistCard>
      )}

      {!isLoading && overview && overview.courses.length > 0 && (
        <>
          <div className="mb-6 sm:mb-8">
            <TeacherStatsBar
              isDark={isDark}
              totalStudents={overview.total_students}
              sessionsAssigned={overview.total_sessions_assigned}
              avgScore={overview.overall_avg_score}
              completionRate={overview.overall_completion_rate}
            />
          </div>

          <SectionLabel num="002" label="COURSES" isDark={isDark} />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {overview.courses.map((course) => (
              <Link key={course.course_id} href={`/teacher/analytics/${course.course_id}`}>
                <BrutalistCard
                  isDark={isDark}
                  className={`flex flex-col h-full hover:-translate-y-0.5 ${isDark ? "hover:border-white/30" : "hover:border-black/25"}`}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className={`font-mono text-sm font-bold ${t.text} tracking-wider`}>
                      {course.title.toUpperCase()}
                    </h3>
                    <BrutalistBadge isDark={isDark} variant="info">{course.course_code}</BrutalistBadge>
                  </div>

                  <div className="mt-auto space-y-2">
                    <div className="flex items-center justify-between font-mono text-xs">
                      <span className={t.textDim}>STUDENTS</span>
                      <span className={`font-medium ${t.text}`}>{course.enrolled_students}</span>
                    </div>
                    <div className="flex items-center justify-between font-mono text-xs">
                      <span className={t.textDim}>SESSIONS</span>
                      <span className={`font-medium ${t.text}`}>{course.sessions_assigned}</span>
                    </div>
                    <div className="flex items-center justify-between font-mono text-xs">
                      <span className={t.textDim}>AVG SCORE</span>
                      <span className={`font-medium ${t.text}`}>{course.avg_score_percentage}%</span>
                    </div>
                    <div className="flex items-center justify-between font-mono text-xs">
                      <span className={t.textDim}>COMPLETION</span>
                      <span className={`font-medium ${t.text}`}>{course.completion_rate_percentage}%</span>
                    </div>
                  </div>
                </BrutalistCard>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
