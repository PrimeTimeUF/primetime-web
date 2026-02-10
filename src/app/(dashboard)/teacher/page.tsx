"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button, Card, CreateCourseModal } from "@/components";

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
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-black">
            Your Courses
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and organize your course materials
          </p>
        </div>
        <Button
          iconBefore={
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <line x1="8" y1="3" x2="8" y2="13" />
              <line x1="3" y1="8" x2="13" y2="8" />
            </svg>
          }
          onClick={() => setModalOpen(true)}
        >
          Create Course
        </Button>
      </div>

      {/* Error state */}
      {error && (
        <p className="mb-6 text-sm text-red-500">{error}</p>
      )}

      {/* Loading state */}
      {isLoading && (
        <p className="text-sm text-gray-400">Loading courses...</p>
      )}

      {/* Empty state */}
      {!isLoading && !error && courses.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-16 px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 mb-4">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-400"
              aria-hidden="true"
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            No courses yet
          </h2>
          <p className="mt-1 max-w-sm text-sm text-gray-500">
            Create your first course to start uploading materials and generating
            priming sessions for your students.
          </p>
          <Button className="mt-6" onClick={() => setModalOpen(true)}>
            Create Your First Course
          </Button>
        </div>
      )}

      {/* Courses grid */}
      {!isLoading && courses.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Link key={course.id} href={`/teacher/courses/${course.id}`}>
              <Card className="flex flex-col hover:border-gray-300 transition-colors">
                <Card.Header>
                  <Card.Title>{course.title}</Card.Title>
                  {course.description && (
                    <Card.Description>{course.description}</Card.Description>
                  )}
                </Card.Header>
                <Card.Content className="mt-auto space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Course Code</span>
                    <span className="font-medium text-gray-900">
                      {course.course_code}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Semester</span>
                    <span className="font-medium text-gray-900">
                      {course.semester}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Invitation Code</span>
                    <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs font-medium text-gray-900">
                      {course.invitation_code}
                    </span>
                  </div>
                </Card.Content>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Create Course Modal */}
      <CreateCourseModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCourseCreated={fetchCourses}
      />
    </div>
  );
}
