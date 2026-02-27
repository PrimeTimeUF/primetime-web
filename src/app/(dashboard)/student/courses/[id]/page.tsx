"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components";
import type { StudentCourseDetail, StudentCourseProgress } from "@/lib/types/student-course";
import type { StudentAssignmentView } from "@/lib/types/session-assignment";

type FilterKey = "all" | "upcoming" | "completed";

export default function StudentCourseDetailPage() {
  const { id } = useParams<{ id: string }>();
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
        <p className="text-sm text-gray-400">Loading course...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-red-500">{error}</p>
        <Link
          href="/student"
          className="mt-4 text-sm font-medium text-gray-500 hover:text-black"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (!course) return null;

  return (
    <>
      {/* Course Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-[1200px] items-center gap-4">
          <Link
            href="/student"
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-black transition-colors hover:border-gray-400 hover:bg-gray-100"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M10 12L6 8l4-4" />
            </svg>
            Back
          </Link>

          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100 text-2xl">
            &#128218;
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-black">
              {course.title}
            </h1>
            <div className="mt-1 flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-2">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <rect x="2" y="3" width="10" height="9" rx="1" />
                  <path d="M2 6h10M5 3V1M9 3V1" />
                </svg>
                {course.course_code}
              </span>
              <span className="flex items-center gap-2">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <circle cx="7" cy="7" r="5" />
                  <path d="M7 4v3l2 2" />
                </svg>
                {course.semester}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-[1200px] px-6 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
          {/* Main Column */}
          <div className="min-w-0">
            {/* Course Overview */}
            <Card className="mb-6 p-6">
              <h2 className="mb-4 text-lg font-semibold text-black">
                Course Overview
              </h2>
              {course.description && (
                <p className="mb-4 leading-relaxed text-gray-600">
                  {course.description}
                </p>
              )}
              <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">
                  {getInitials(course.teacher_name)}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-500">
                    Instructor
                  </p>
                  <p className="font-medium text-black">
                    {course.teacher_name}
                  </p>
                </div>
              </div>
            </Card>

            {/* Priming Sessions */}
            <Card className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-black">
                  Priming Sessions
                </h2>
                <div className="flex gap-2">
                  {(["all", "upcoming", "completed"] as FilterKey[]).map(
                    (key) => (
                      <button
                        key={key}
                        onClick={() => setFilter(key)}
                        className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                          filter === key
                            ? "border-black bg-black text-white"
                            : "border-gray-300 text-gray-600 hover:border-gray-400 hover:text-black"
                        }`}
                      >
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </button>
                    )
                  )}
                </div>
              </div>

              {filteredAssignments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 text-4xl">
                    &#128214;
                  </div>
                  <h3 className="text-xl font-semibold text-black">
                    {filter === "all"
                      ? "No sessions assigned yet"
                      : filter === "upcoming"
                        ? "No upcoming sessions"
                        : "No completed sessions"}
                  </h3>
                  <p className="mt-2 text-gray-600">
                    {filter === "all"
                      ? "Your teacher hasn't assigned any priming sessions yet."
                      : filter === "upcoming"
                        ? "You're all caught up!"
                        : "Complete a priming session to see it here."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAssignments.map((assignment) => {
                    const isCompleted = assignment.completion !== null;
                    const overdue =
                      !isCompleted && isOverdue(assignment.due_date);
                    const dueSoon =
                      !isCompleted && isDueSoon(assignment.due_date);

                    return (
                      <div
                        key={assignment.id}
                        className={`flex items-center gap-4 rounded-xl border p-5 transition-all ${
                          isCompleted
                            ? "border-gray-200 bg-gray-50 opacity-70 hover:opacity-100"
                            : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white hover:shadow-md hover:-translate-y-0.5"
                        } cursor-pointer`}
                      >
                        {/* Session icon */}
                        <div
                          className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border text-xl ${
                            isCompleted
                              ? "border-green-400 bg-green-50 text-green-500"
                              : "border-gray-200 bg-white"
                          }`}
                        >
                          {isCompleted ? (
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : (
                            "📖"
                          )}
                        </div>

                        {/* Session details */}
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-semibold text-black">
                            {assignment.session.title || "Untitled Session"}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-2">
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 12 12"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                              >
                                <circle cx="6" cy="6" r="4" />
                                <path d="M6 3v3l2 1" />
                              </svg>
                              {formatDueDate(assignment.due_date)}
                            </span>
                            {assignment.session.lecture_name && (
                              <span className="flex items-center gap-2">
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 12 12"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                >
                                  <rect
                                    x="2"
                                    y="2"
                                    width="8"
                                    height="8"
                                    rx="1"
                                  />
                                  <path d="M2 5h8" />
                                </svg>
                                {assignment.session.lecture_name}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status + Action */}
                        <div className="flex items-center gap-3">
                          {isCompleted ? (
                            <>
                              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium uppercase tracking-wider text-green-600">
                                Completed
                              </span>
                              <Link
                                href={`/student/courses/${id}/sessions/${assignment.session_id}?review=true`}
                                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-gray-100"
                              >
                                Review
                              </Link>
                            </>
                          ) : (
                            <>
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wider ${
                                  overdue
                                    ? "bg-red-100 text-red-600"
                                    : dueSoon
                                      ? "bg-amber-100 text-amber-700"
                                      : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {overdue ? "Overdue" : "Upcoming"}
                              </span>
                              <Link
                                href={`/student/courses/${id}/sessions/${assignment.session_id}`}
                                className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                              >
                                Start
                              </Link>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-[120px] lg:h-fit">
            {/* Progress Card */}
            <Card className="mb-6 p-6">
              <h3 className="mb-5 font-semibold text-black">Your Progress</h3>

              {progress ? (
                <>
                  <div className="mb-5">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-gray-600">Course Completion</span>
                      <span className="font-semibold text-black">
                        {progress.completion_percentage}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-black transition-all duration-500"
                        style={{
                          width: `${progress.completion_percentage}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="mb-5">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-gray-600">Sessions Completed</span>
                      <span className="font-semibold text-black">
                        {progress.completed_count}/{progress.total_assigned}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-black transition-all duration-500"
                        style={{
                          width:
                            progress.total_assigned > 0
                              ? `${(progress.completed_count / progress.total_assigned) * 100}%`
                              : "0%",
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-gray-200 pt-5">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-black">
                        {progress.average_score}%
                      </p>
                      <p className="text-xs uppercase tracking-wider text-gray-600">
                        Avg Score
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-black">
                        {progress.completed_count}
                      </p>
                      <p className="text-xs uppercase tracking-wider text-gray-600">
                        Done
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500">No progress data yet.</p>
              )}
            </Card>

            {/* Quick Links */}
            <Card className="p-6">
              <h3 className="mb-4 font-semibold text-black">Quick Links</h3>
              <div className="space-y-2">
                <Link
                  href="/student"
                  className="flex items-center gap-3 rounded-xl border border-gray-200 p-3 text-sm font-medium text-black transition-colors hover:border-gray-300 hover:bg-gray-50"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-sm">
                    &#128202;
                  </span>
                  <span className="flex-1">My Dashboard</span>
                  <span className="text-gray-400">&rarr;</span>
                </Link>
              </div>
            </Card>
          </aside>
        </div>
      </main>
    </>
  );
}
