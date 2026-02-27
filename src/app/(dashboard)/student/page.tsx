"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { EnrollCourseModal } from "@/components";

interface UserData {
  id: string;
  email: string;
  role: string;
  full_name: string;
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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const userMenuRef = useRef<HTMLDivElement>(null);

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

  // Fetch user data on mount
  useEffect(() => {
    async function fetchUserData() {
      try {
        const supabase = createClient();

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          console.error("Session error:", sessionError);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchEnrollments]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userMenuOpen]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        router.push("/login");
      } else {
        console.error("Logout failed");
        setIsLoggingOut(false);
      }
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getFirstName = (name: string) => {
    if (!name) return "there";
    return name.trim().split(" ")[0];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Error loading user data</div>
      </div>
    );
  }

  const hasEnrollments = enrollments.length > 0;

  return (
    <>
      {/* Dashboard Header / Navigation */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 h-16">
        <div className="max-w-[1200px] mx-auto px-6 h-full flex items-center justify-between">
          {/* Left: Logo */}
          <div className="flex items-center gap-8">
            <a href="#" className="text-xl font-bold tracking-tight text-black">
              PrimeTime
            </a>
          </div>

          {/* Right: Enroll Button + User Menu */}
          <div className="flex items-center gap-4">
            {/* Enroll in Course Button */}
            <button
              onClick={() => setEnrollModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-all"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line x1="8" y1="3" x2="8" y2="13"></line>
                <line x1="3" y1="8" x2="13" y2="8"></line>
              </svg>
              Enroll in Course
            </button>

            {/* User Menu */}
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 px-3 py-2 bg-transparent border-none rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center text-sm font-semibold">
                  {getInitials(userData.full_name)}
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-black">{userData.full_name}</div>
                  <div className="text-xs text-gray-500">Student</div>
                </div>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 6l4 4 4-4" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute top-full right-0 mt-2 min-w-[200px] bg-white border border-gray-200 rounded-xl shadow-lg p-2">
                  <a
                    href="#profile"
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-black bg-transparent border-none rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <svg
                      className="w-[18px] h-[18px] text-gray-500"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    Profile
                  </a>
                  <a
                    href="#settings"
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-black bg-transparent border-none rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <svg
                      className="w-[18px] h-[18px] text-gray-500"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    Settings
                  </a>
                  <div className="h-px bg-gray-100 my-2"></div>
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 bg-transparent border-none rounded-md hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg
                      className="w-[18px] h-[18px]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    {isLoggingOut ? "Logging out..." : "Log out"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Main Content */}
      <main className="max-w-[1200px] mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-black">
              Welcome back, {getFirstName(userData.full_name)}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {hasEnrollments
                ? `You have ${enrollments.length} course${enrollments.length === 1 ? "" : "s"}`
                : "Get started by enrolling in your first course"}
            </p>
          </div>
        </div>

        {/* Empty State */}
        {!hasEnrollments && (
          <div className="flex flex-col items-center justify-center py-16 px-6 bg-white border border-gray-200 rounded-xl">
            <svg
              className="w-16 h-16 text-gray-300 mb-6"
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
            <h2 className="text-xl font-semibold text-black mb-3">No courses yet</h2>
            <p className="text-sm text-gray-500 text-center max-w-md mb-6">
              Enroll in a course using an invitation code from your teacher to start your priming sessions.
            </p>
            <button
              onClick={() => setEnrollModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-all"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line x1="8" y1="3" x2="8" y2="13"></line>
                <line x1="3" y1="8" x2="13" y2="8"></line>
              </svg>
              Enroll in Your First Course
            </button>
          </div>
        )}

        {/* Enrolled Courses */}
        {hasEnrollments && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-black">Your Courses</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {enrollments.map((enrollment) => (
                <article
                  key={enrollment.id}
                  className="bg-white border border-gray-200 rounded-xl p-5 cursor-pointer hover:border-gray-300 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  <div className="flex items-start gap-4 mb-3">
                    <div className="w-11 h-11 bg-gray-100 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
                      📚
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-black mb-1 leading-tight">
                        {enrollment.course.title}
                      </h3>
                      <span className="text-sm text-gray-500">
                        {enrollment.course.course_code} · {enrollment.course.semester}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Enroll in Course Modal */}
      <EnrollCourseModal
        open={enrollModalOpen}
        onOpenChange={setEnrollModalOpen}
        onEnrolled={fetchEnrollments}
      />
    </>
  );
}
