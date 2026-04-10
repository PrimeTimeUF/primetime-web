"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { TeacherStatsBar, TeacherSessionStatsTable, TeacherStudentStatsTable } from "@/components";
import { useDashboardTheme } from "../../dashboard-theme-context";
import { BrutalistBadge, SectionLabel, themeTokens } from "@/components/ui/dashboard-primitives";
import type { TeacherCourseAnalyticsDetail } from "@/lib/types/teacher-analytics";

export default function TeacherCourseAnalyticsPage() {
  const { isDark } = useDashboardTheme();
  const t = themeTokens(isDark);
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<TeacherCourseAnalyticsDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDetail = useCallback(async () => {
    setError("");
    try {
      const res = await fetch(`/api/teacher/analytics/${id}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to load course analytics.");
        return;
      }
      const data = await res.json();
      setDetail(data.detail);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return (
    <div>
      <Link
        href="/teacher/analytics"
        className={`inline-block mb-6 font-mono text-xs ${t.textDim} hover:${t.text} transition-colors tracking-wider`}
      >
        &larr; ALL COURSES
      </Link>

      {error && (
        <div className={`mb-6 border ${isDark ? "border-red-500/40 bg-red-500/10" : "border-red-500/60 bg-red-50"} p-3 font-mono text-xs ${isDark ? "text-red-400" : "text-red-600"}`}>
          {error}
        </div>
      )}

      {isLoading && (
        <p className={`font-mono text-xs ${t.textDim} tracking-wider`}>LOADING ANALYTICS...</p>
      )}

      {!isLoading && detail && (
        <>
          <SectionLabel num="001" label="COURSE ANALYTICS" isDark={isDark} />

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
            <h1 className={`font-mono text-xl sm:text-2xl font-bold tracking-wider ${t.text} transition-colors duration-500 break-words`}>
              {detail.title.toUpperCase()}
            </h1>
            <BrutalistBadge isDark={isDark} variant="info">{detail.course_code}</BrutalistBadge>
          </div>

          <div className="mb-6 sm:mb-8">
            <TeacherStatsBar
              isDark={isDark}
              totalStudents={detail.enrolled_students}
              sessionsAssigned={detail.sessions_assigned}
              avgScore={detail.avg_score_percentage}
              completionRate={detail.completion_rate_percentage}
            />
          </div>

          <SectionLabel num="002" label="SESSION BREAKDOWN" isDark={isDark} />
          <div className="mb-6 sm:mb-8">
            <TeacherSessionStatsTable
              isDark={isDark}
              sessions={detail.sessions}
              enrolledStudents={detail.enrolled_students}
            />
          </div>

          <SectionLabel num="003" label="STUDENT PERFORMANCE" isDark={isDark} />
          <TeacherStudentStatsTable isDark={isDark} students={detail.students} />
        </>
      )}
    </div>
  );
}
