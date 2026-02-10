"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

interface UserData {
  id: string;
  email: string;
  role: string;
  full_name: string;
}

export default function StudentDashboardPage() {
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [invitationCode, setInvitationCode] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Fetch user data on mount
  useEffect(() => {
    async function fetchUserData() {
      try {
        const supabase = createClient();

        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          console.error("Session error:", sessionError);
          router.push("/login");
          return;
        }

        // Fetch user profile from public.users table
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
  }, [router]);

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

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && enrollModalOpen) {
        setEnrollModalOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [enrollModalOpen]);

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

  const handleEnrollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = invitationCode.trim();

    if (code.length < 6) {
      alert("Please enter a valid invitation code (at least 6 characters)");
      return;
    }

    console.log("Enrolling with code:", code);
    alert(`Successfully enrolled in course! (Demo mode)\nCode: ${code}`);
    setEnrollModalOpen(false);
    setInvitationCode("");
  };

  // Helper function to get user initials
  const getInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Helper function to get first name
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
              Get started by enrolling in your first course
            </p>
          </div>
        </div>

        {/* Empty State for Non-Enrolled Students */}
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

        {/* Future: Dashboard Grid with Content - Hidden for now */}
        {false && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
            {/* Main Content Area */}
            <div className="flex flex-col gap-8">
              {/* Upcoming Sessions Section */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-black">Upcoming Sessions</h2>
                  <a href="#" className="text-sm font-medium text-gray-500 hover:text-black transition-colors">
                    View all
                  </a>
                </div>

                <div className="flex flex-col gap-3">
                {/* Session 1: Ready to start */}
                <article className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4 cursor-pointer hover:border-gray-300 hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-6 h-6 text-gray-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-black mb-1 leading-tight">
                      Newton&apos;s Laws of Motion
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>Introduction to Physics</span>
                      <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                      <span>PHYS 101</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                      <svg
                        className="w-3.5 h-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <span>Lecture: Tomorrow, Feb 5</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                      5 min read
                    </span>
                    <button className="px-4 py-2 text-xs font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-all">
                      Start
                    </button>
                  </div>
                </article>

                {/* Session 2: Ready to start */}
                <article className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4 cursor-pointer hover:border-gray-300 hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-6 h-6 text-gray-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-black mb-1 leading-tight">
                      Introduction to Derivatives
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>Calculus II</span>
                      <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                      <span>MATH 201</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                      <svg
                        className="w-3.5 h-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <span>Lecture: Thu, Feb 6</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                      3 min read
                    </span>
                    <button className="px-4 py-2 text-xs font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-all">
                      Start
                    </button>
                  </div>
                </article>

                {/* Session 3: Ready to start */}
                <article className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4 cursor-pointer hover:border-gray-300 hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-6 h-6 text-gray-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-black mb-1 leading-tight">
                      Organic Chemical Bonds
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>Organic Chemistry</span>
                      <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                      <span>CHEM 301</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                      <svg
                        className="w-3.5 h-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <span>Lecture: Fri, Feb 7</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                      5 min read
                    </span>
                    <button className="px-4 py-2 text-xs font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-all">
                      Start
                    </button>
                  </div>
                </article>

                {/* Session 4: Completed */}
                <article className="bg-gray-50 border border-gray-200 rounded-xl p-5 flex items-center gap-4 cursor-pointer hover:border-gray-300 hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-6 h-6 text-green-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-black mb-1 leading-tight">
                      Conservation of Energy
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>Introduction to Physics</span>
                      <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                      <span>PHYS 101</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                      <svg
                        className="w-3.5 h-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <span>Completed: Feb 3</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      <svg
                        className="w-3.5 h-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Completed
                    </span>
                  </div>
                </article>
              </div>
            </section>

            {/* Enrolled Courses Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-black">Your Courses</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Course Card 1 */}
                <article className="bg-white border border-gray-200 rounded-xl p-5 cursor-pointer hover:border-gray-300 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                  <div className="flex items-start gap-4 mb-3">
                    <div className="w-11 h-11 bg-gray-100 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
                      📚
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-black mb-1 leading-tight">
                        Introduction to Physics
                      </h3>
                      <span className="text-sm text-gray-500">PHYS 101 · Spring 2026</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <svg
                        className="w-3.5 h-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                      <span>
                        <span className="font-medium text-black">8</span> sessions
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <svg
                        className="w-3.5 h-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>
                        <span className="font-medium text-black">5</span> completed
                      </span>
                    </div>
                  </div>
                </article>

                {/* Course Card 2 */}
                <article className="bg-white border border-gray-200 rounded-xl p-5 cursor-pointer hover:border-gray-300 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                  <div className="flex items-start gap-4 mb-3">
                    <div className="w-11 h-11 bg-gray-100 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
                      📊
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-black mb-1 leading-tight">
                        Calculus II
                      </h3>
                      <span className="text-sm text-gray-500">MATH 201 · Spring 2026</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <svg
                        className="w-3.5 h-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                      <span>
                        <span className="font-medium text-black">6</span> sessions
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <svg
                        className="w-3.5 h-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>
                        <span className="font-medium text-black">4</span> completed
                      </span>
                    </div>
                  </div>
                </article>

                {/* Course Card 3 */}
                <article className="bg-white border border-gray-200 rounded-xl p-5 cursor-pointer hover:border-gray-300 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                  <div className="flex items-start gap-4 mb-3">
                    <div className="w-11 h-11 bg-gray-100 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
                      🧪
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-black mb-1 leading-tight">
                        Organic Chemistry
                      </h3>
                      <span className="text-sm text-gray-500">CHEM 301 · Spring 2026</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <svg
                        className="w-3.5 h-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                      <span>
                        <span className="font-medium text-black">5</span> sessions
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <svg
                        className="w-3.5 h-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>
                        <span className="font-medium text-black">3</span> completed
                      </span>
                    </div>
                  </div>
                </article>
              </div>
            </section>
          </div>

          {/* Progress Overview Sidebar */}
          <aside className="bg-white border border-gray-200 rounded-xl p-6 h-fit sticky top-24">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-black">Your Progress</h2>
            </div>

            <div className="flex flex-col gap-5">
              {/* Weekly Progress */}
              <div className="mt-2">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-black">This Week</span>
                  <span className="text-sm text-gray-500">4 of 5 sessions</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-black rounded-full transition-all" style={{ width: "80%" }}></div>
                </div>
              </div>

              <div className="h-px bg-gray-100 my-5"></div>

              {/* Sessions Completed */}
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-green-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-xl font-bold text-black leading-tight">12 / 15</div>
                  <div className="text-sm text-gray-500">Sessions completed</div>
                </div>
              </div>

              {/* Average Score */}
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-gray-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 20V10" />
                    <path d="M18 20V4" />
                    <path d="M6 20v-4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-xl font-bold text-black leading-tight">82%</div>
                  <div className="text-sm text-gray-500">Average quiz score</div>
                </div>
              </div>

              {/* Current Streak */}
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-lg bg-yellow-100 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-yellow-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-xl font-bold text-black leading-tight">5 days</div>
                  <div className="text-sm text-gray-500">Current streak</div>
                </div>
              </div>
            </div>
          </aside>
        </div>
        )}
      </main>

      {/* Enroll in Course Modal */}
      {enrollModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-6 z-[100]"
          onClick={() => setEnrollModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold">Enroll in Course</h2>
              <button
                onClick={() => setEnrollModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center bg-transparent border-none rounded-md text-gray-500 hover:bg-gray-100 hover:text-black transition-all cursor-pointer"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleEnrollSubmit}>
              <div className="p-6">
                <div className="flex flex-col gap-2">
                  <label htmlFor="invitationCode" className="text-sm font-medium text-black">
                    Invitation Code
                  </label>
                  <input
                    type="text"
                    id="invitationCode"
                    className="w-full px-4 py-4 text-lg font-medium text-center tracking-widest uppercase text-black bg-white border border-gray-200 rounded-lg transition-all focus:outline-none focus:border-black focus:shadow-[0_0_0_3px_rgba(0,0,0,0.05)]"
                    placeholder="Enter code"
                    maxLength={8}
                    autoComplete="off"
                    value={invitationCode}
                    onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                    required
                  />
                  <span className="text-xs text-gray-500 text-center">
                    Ask your teacher for the course invitation code
                  </span>
                </div>
              </div>
              <div className="flex gap-3 justify-end p-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEnrollModalOpen(false)}
                  className="px-6 py-3 text-sm font-medium text-black bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-all"
                >
                  Join Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
