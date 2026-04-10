"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EnrollCourseModal, AnalyticsStatsBar, SessionHistoryTable } from "@/components";
import { useDashboardTheme } from "../teacher/dashboard-theme-context";
import { SectionLabel, BrutalistCard, BrutalistButton, themeTokens } from "@/components/ui/dashboard-primitives";
import { createClient } from "@/utils/supabase/client";
import type { StudentAnalytics } from "@/lib/types/student-analytics";

interface UserData {
  id: string;
  email: string;
  role: string;
  full_name: string;
  profile_image_url: string | null;
}

interface CourseData {
  id: string;
  title: string;
  course_code: string;
  semester: string;
  description: string | null;
}

interface Enrollment {
  id: string;
  enrolled_at: string;
  course: CourseData;
}

export default function StudentDashboardPage() {
  const router = useRouter();
  const { isDark } = useDashboardTheme();
  const t = themeTokens(isDark);

  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [analytics, setAnalytics] = useState<StudentAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEnrollments = useCallback(async () => {
    try {
      const res = await fetch("/api/enrollments");
      if (res.ok) {
        const data = await res.json();
        setEnrollments(data.enrollments ?? []);
      }
    } catch (error) {
      console.error("Failed to fetch enrollments:", error);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch("/api/student/results");
      if (res.ok) {
        const data: StudentAnalytics = await res.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  useEffect(() => {
    async function fetchUserData() {
      try {
        const supabase = createClient();
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          router.push("/login");
          return;
        }

        const { data: user, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (userError) {
          console.error("Error fetching user data:", userError);
        } else if (user) {
          setUserData(user);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserData();
    fetchEnrollments();
    fetchAnalytics();
  }, [fetchEnrollments, fetchAnalytics, router]);

  const getFirstName = (name: string) => {
    if (!name) return "there";
    return name.trim().split(" ")[0];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className={`font-mono text-sm ${t.textMid}`}>LOADING...</p>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className={`font-mono text-sm ${t.textMid}`}>ERROR LOADING USER DATA</p>
      </div>
    );
  }

  const hasEnrollments = enrollments.length > 0;

  return (
    <>
      <SectionLabel num="001" label="DASHBOARD" isDark={isDark} />

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
        <div className="min-w-0">
          <h1 className={`font-mono text-xl sm:text-2xl font-bold tracking-wider ${t.text} break-words`}>
            Welcome back, {getFirstName(userData.full_name)}
          </h1>
          <p className={`mt-1 font-mono text-xs sm:text-sm ${t.textMid}`}>
            {hasEnrollments
              ? `You have ${enrollments.length} course${enrollments.length === 1 ? "" : "s"}`
              : "Get started by enrolling in your first course"}
          </p>
        </div>
        <BrutalistButton
          isDark={isDark}
          onClick={() => setEnrollModalOpen(true)}
          className="w-full sm:w-auto"
          iconBefore={
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="8" y1="3" x2="8" y2="13" />
              <line x1="3" y1="8" x2="13" y2="8" />
            </svg>
          }
        >
          ENROLL
        </BrutalistButton>
      </div>

      {/* Performance Section */}
      {hasEnrollments && (
        <section className="mb-6 sm:mb-8">
          <SectionLabel num="002" label="PERFORMANCE" isDark={isDark} />
          {analyticsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <BrutalistCard key={i} isDark={isDark}>
                  <div className={`h-4 w-24 ${isDark ? 'bg-white/10' : 'bg-black/10'} mb-2`} />
                  <div className={`h-7 w-16 ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
                </BrutalistCard>
              ))}
            </div>
          ) : analytics ? (
            <div className="space-y-4">
              <AnalyticsStatsBar summary={analytics.summary} isDark={isDark} />
              <SessionHistoryTable results={analytics.results} isDark={isDark} />
            </div>
          ) : null}
        </section>
      )}

      {/* Empty State */}
      {!hasEnrollments && (
        <BrutalistCard isDark={isDark} className="flex flex-col items-center justify-center py-12 px-4 sm:py-16 sm:px-6">
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
          <h2 className={`font-mono text-xl font-bold tracking-wider ${t.text} mb-3`}>
            NO COURSES YET
          </h2>
          <p className={`font-mono text-sm ${t.textMid} text-center max-w-md mb-6`}>
            Enroll in a course using an invitation code from your teacher to start your priming sessions.
          </p>
          <BrutalistButton
            isDark={isDark}
            size="lg"
            onClick={() => setEnrollModalOpen(true)}
            iconBefore={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="8" y1="3" x2="8" y2="13" />
                <line x1="3" y1="8" x2="13" y2="8" />
              </svg>
            }
          >
            ENROLL IN YOUR FIRST COURSE
          </BrutalistButton>
        </BrutalistCard>
      )}

      {/* Enrolled Courses */}
      {hasEnrollments && (
        <section>
          <SectionLabel num="003" label="COURSES" isDark={isDark} />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
            {enrollments.map((enrollment) => (
              <Link
                key={enrollment.id}
                href={`/student/courses/${enrollment.course.id}`}
                className="flex"
              >
                <BrutalistCard
                  isDark={isDark}
                  as="article"
                  className={`w-full cursor-pointer hover:-translate-y-0.5 ${isDark ? 'hover:border-white/30' : 'hover:border-black/25'}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-11 h-11 border ${t.border} flex items-center justify-center font-mono text-xs font-bold ${t.text} flex-shrink-0`}>
                      {enrollment.course.course_code.substring(0, 3)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-mono text-sm font-bold ${t.text} mb-1 leading-tight tracking-wider line-clamp-2`}>
                        {enrollment.course.title}
                      </h3>
                      <span className={`font-mono text-xs ${t.textMid} tracking-wider`}>
                        {enrollment.course.course_code} · {enrollment.course.semester}
                      </span>
                    </div>
                  </div>
                </BrutalistCard>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Enroll Modal */}
      <EnrollCourseModal
        open={enrollModalOpen}
        onOpenChange={setEnrollModalOpen}
        onEnrolled={fetchEnrollments}
        isDark={isDark}
      />
    </>
  );
}
