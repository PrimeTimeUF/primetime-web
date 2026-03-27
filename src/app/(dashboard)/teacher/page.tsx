"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { CreateCourseModal } from "@/components";
import { useDashboardTheme } from "./dashboard-theme-context";
import { BrutalistCard, BrutalistButton, SectionLabel, themeTokens } from "@/components/ui/dashboard-primitives";

interface Course {
  id: string;
  title: string;
  description: string | null;
  course_code: string;
  semester: string;
  invitation_code: string;
  created_at: string;
}

export default function TeacherDashboardPage() {
  const { isDark } = useDashboardTheme();
  const t = themeTokens(isDark);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const fetchCourses = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/courses");
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to load courses.");
        return;
      }
      const data = await res.json();
      setCourses(data.courses);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return (
    <div>
      <SectionLabel num="001" label="COURSES" isDark={isDark} />

      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`font-mono text-2xl font-bold tracking-wider ${t.text} transition-colors duration-500`}>
            YOUR COURSES
          </h1>
          <p className={`mt-1 font-mono text-xs ${t.textMid} tracking-wider transition-colors duration-500`}>
            Manage and organize your course materials
          </p>
        </div>
        <BrutalistButton
          isDark={isDark}
          onClick={() => setModalOpen(true)}
          iconBefore={
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <line x1="8" y1="3" x2="8" y2="13" />
              <line x1="3" y1="8" x2="13" y2="8" />
            </svg>
          }
        >
          CREATE COURSE
        </BrutalistButton>
      </div>

      {/* Error state */}
      {error && (
        <div className={`mb-6 border ${isDark ? 'border-red-500/40 bg-red-500/10' : 'border-red-500/60 bg-red-50'} p-3 font-mono text-xs ${isDark ? 'text-red-400' : 'text-red-600'}`}>
          {error}
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <p className={`font-mono text-xs ${t.textDim} tracking-wider`}>LOADING COURSES...</p>
      )}

      {/* Empty state */}
      {!isLoading && !error && courses.length === 0 && (
        <BrutalistCard isDark={isDark} className="flex flex-col items-center justify-center py-16 px-6 text-center border-dashed">
          <div className={`flex h-14 w-14 items-center justify-center border ${t.border} mb-4`}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={t.textMid} aria-hidden="true">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <h2 className={`font-mono text-sm font-bold ${t.text} tracking-wider`}>NO COURSES YET</h2>
          <p className={`mt-2 max-w-sm font-mono text-xs ${t.textMid} leading-relaxed`}>
            Create your first course to start uploading materials and generating priming sessions.
          </p>
          <BrutalistButton isDark={isDark} className="mt-6" onClick={() => setModalOpen(true)}>
            CREATE YOUR FIRST COURSE
          </BrutalistButton>
        </BrutalistCard>
      )}

      {/* Courses grid */}
      {!isLoading && courses.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Link key={course.id} href={`/teacher/courses/${course.id}`}>
              <BrutalistCard
                isDark={isDark}
                className={`flex flex-col h-full hover:-translate-y-0.5 ${isDark ? 'hover:border-white/30' : 'hover:border-black/25'}`}
              >
                <h3 className={`font-mono text-sm font-bold ${t.text} tracking-wider mb-4`}>
                  {course.title.toUpperCase()}
                </h3>
                {course.description && (
                  <p className={`font-mono text-xs ${t.textMid} mb-4 leading-relaxed`}>
                    {course.description}
                  </p>
                )}
                <div className="mt-auto space-y-2">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className={t.textDim}>COURSE CODE</span>
                    <span className={`font-medium ${t.text}`}>{course.course_code}</span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className={t.textDim}>SEMESTER</span>
                    <span className={`font-medium ${t.text}`}>{course.semester}</span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className={t.textDim}>INVITE CODE</span>
                    <span className={`border ${t.border} px-2 py-0.5 font-mono text-[10px] font-medium ${t.text} tracking-widest`}>
                      {course.invitation_code}
                    </span>
                  </div>
                </div>
              </BrutalistCard>
            </Link>
          ))}
        </div>
      )}

      {/* Create Course Modal — stays light-themed */}
      <CreateCourseModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCourseCreated={fetchCourses}
      />
    </div>
  );
}
