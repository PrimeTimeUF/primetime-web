"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button, Card, CreateSessionModal, AssignSessionModal } from "@/components";
import type { PrimingSessionListItem } from "@/lib/types/priming-session";
import type { SessionAssignmentWithSession } from "@/lib/types/session-assignment";

interface Course {
  id: string;
  title: string;
  description: string | null;
  course_code: string;
  semester: string;
  invitation_code: string;
  created_at: string;
}

interface CourseMaterial {
  id: string;
  course_id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  file_type: string | null;
  uploaded_at: string;
  lecture_name: string | null;
  lecture_order: number | null;
}

type TabKey = "materials" | "students" | "sessions";

export default function TeacherCourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("materials");
  const [sessions, setSessions] = useState<PrimingSessionListItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [studentCount, setStudentCount] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStudentCount = useCallback(async () => {
    try {
      const res = await fetch(`/api/courses/${id}/students`);
      if (res.ok) {
        const data = await res.json();
        setStudentCount(data.count ?? 0);
      }
    } catch (err) {
      console.error("Failed to fetch student count:", err);
    }
  }, [id]);

  const fetchCourse = useCallback(async () => {
    setError("");
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
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch(`/api/courses/${id}/sessions`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    } finally {
      setSessionsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCourse();
    fetchSessions();
    fetchStudentCount();
  }, [fetchCourse, fetchSessions, fetchStudentCount]);

  // Poll while any session is generating
  useEffect(() => {
    const hasGenerating = sessions.some((s) => s.status === "generating");

    if (hasGenerating) {
      pollRef.current = setInterval(fetchSessions, 5000);
    } else if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, [sessions, fetchSessions]);

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
          href="/teacher"
          className="mt-4 text-sm font-medium text-gray-500 hover:text-black"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (!course) return null;

  return (
    <div>
      {/* Back link */}
      <Link
        href="/teacher"
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-black"
      >
        <svg
          width="16"
          height="16"
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
        Back to Dashboard
      </Link>

      {/* Course header */}
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100 text-2xl">
            &#128218;
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-black">
              {course.title}
            </h1>
            <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
              <span>{course.course_code}</span>
              <span className="h-1 w-1 rounded-full bg-gray-300" />
              <span>{course.semester}</span>
              <span className="h-1 w-1 rounded-full bg-gray-300" />
              <span>{studentCount} student{studentCount !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" disabled>
            Settings
          </Button>
          <Button disabled>Upload Material</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8 flex gap-8 border-b border-gray-200">
        <TabButton
          label="Materials"
          count={0}
          active={activeTab === "materials"}
          onClick={() => setActiveTab("materials")}
        />
        <TabButton
          label="Students"
          count={studentCount}
          active={activeTab === "students"}
          onClick={() => setActiveTab("students")}
        />
        <TabButton
          label="Priming Sessions"
          count={sessions.length}
          active={activeTab === "sessions"}
          onClick={() => setActiveTab("sessions")}
        />
      </div>

      {/* Tab content */}
      <div className="py-8">
        {activeTab === "materials" && (
          <MaterialsTab courseId={id} sessions={sessions} />
        )}
        {activeTab === "students" && (
          <StudentsTab
            courseId={id}
            invitationCode={course.invitation_code}
          />
        )}
        {activeTab === "sessions" && (
          <SessionsTab
            courseId={id}
            sessions={sessions}
            isLoading={sessionsLoading}
            onRefresh={fetchSessions}
          />
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab Button                                                         */
/* ------------------------------------------------------------------ */

interface TabButtonProps {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}

function TabButton({ label, count, active, onClick }: Readonly<TabButtonProps>) {
  return (
    <button
      onClick={onClick}
      className={`relative pb-4 text-sm font-medium transition-colors ${
        active ? "text-black" : "text-gray-500 hover:text-black"
      }`}
    >
      {label}
      <span
        className={`ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-2 text-xs font-medium ${
          active ? "bg-black text-white" : "bg-gray-100 text-gray-600"
        }`}
      >
        {count}
      </span>
      {active && (
        <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-black" />
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Materials Tab                                                      */
/* ------------------------------------------------------------------ */

interface MaterialsTabProps {
  courseId: string;
  sessions: PrimingSessionListItem[];
}

function MaterialsTab({
  courseId,
  sessions,
}: Readonly<MaterialsTabProps>) {
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [lectureName, setLectureName] = useState("");
  const [existingLectures, setExistingLectures] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMaterials = useCallback(async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}/materials`);
      if (res.ok) {
        const data = await res.json();
        setMaterials(data.materials || []);

        // Extract unique lecture names
        const lectures = Array.from(
          new Set(
            data.materials
              .map((m: CourseMaterial) => m.lecture_name)
              .filter((name: string | null) => name !== null)
          )
        ) as string[];
        setExistingLectures(lectures);
      }
    } catch (error) {
      console.error("Failed to fetch materials:", error);
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const handleUploadClick = () => {
    setShowUploadModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (25MB)
    const MAX_SIZE = 26214400;
    if (file.size > MAX_SIZE) {
      setUploadError("File size must be less than 25MB");
      return;
    }

    // File is selected, now user needs to select/enter lecture in modal
  };

  const handleUploadSubmit = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    if (!lectureName.trim()) {
      setUploadError("Please enter a lecture name");
      return;
    }

    setIsUploading(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("lectureName", lectureName.trim());

      const res = await fetch(`/api/courses/${courseId}/materials`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      // Refresh materials list
      await fetchMaterials();

      // Reset state
      setShowUploadModal(false);
      setLectureName("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (materialId: string) => {
    if (!confirm("Are you sure you want to delete this material?")) return;

    try {
      const res = await fetch(
        `/api/courses/${courseId}/materials?materialId=${materialId}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        throw new Error("Delete failed");
      }

      // Refresh materials list
      await fetchMaterials();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete material");
    }
  };

  const getSessionStatusForMaterial = (materialId: string) => {
    return sessions.find((s) => s.material_id === materialId);
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown size";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-gray-400">Loading materials...</p>
      </div>
    );
  }

  // Group materials by lecture
  const groupedMaterials = materials.reduce((acc, material) => {
    const lecture = material.lecture_name || "Ungrouped";
    if (!acc[lecture]) {
      acc[lecture] = [];
    }
    acc[lecture].push(material);
    return acc;
  }, {} as Record<string, CourseMaterial[]>);

  return (
    <div>
      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-black">
              Upload Course Material
            </h3>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Select File
              </label>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="w-full rounded-md border border-gray-300 p-2 text-sm"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.mov"
              />
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Lecture Name
              </label>
              {existingLectures.length > 0 ? (
                <>
                  <select
                    value={lectureName}
                    onChange={(e) => setLectureName(e.target.value)}
                    className="w-full rounded-md border border-gray-300 p-2 text-sm"
                  >
                    <option value="">-- Select existing or type new below --</option>
                    {existingLectures.map((lecture) => (
                      <option key={lecture} value={lecture}>
                        {lecture}
                      </option>
                    ))}
                  </select>
                  <p className="my-2 text-center text-xs text-gray-500">OR</p>
                  <input
                    type="text"
                    value={lectureName}
                    onChange={(e) => setLectureName(e.target.value)}
                    placeholder="Type a new lecture name"
                    className="w-full rounded-md border border-gray-300 p-2 text-sm"
                  />
                </>
              ) : (
                <input
                  type="text"
                  value={lectureName}
                  onChange={(e) => setLectureName(e.target.value)}
                  placeholder="Enter lecture name"
                  className="w-full rounded-md border border-gray-300 p-2 text-sm"
                />
              )}
              <p className="mt-1 text-xs text-gray-500">
                {existingLectures.length > 0
                  ? "Select an existing lecture or type a new name"
                  : "Enter a name for this lecture"}
              </p>
            </div>

            {uploadError && (
              <p className="mb-4 text-sm text-red-500">{uploadError}</p>
            )}

            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowUploadModal(false);
                  setLectureName("");
                  setUploadError("");
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUploadSubmit}
                disabled={isUploading || !fileInputRef.current?.files?.[0]}
              >
                {isUploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Upload button */}
      <div className="mb-6 flex items-center justify-end">
        <Button
          onClick={handleUploadClick}
          disabled={isUploading}
          iconBefore={
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          }
        >
          Upload Material
        </Button>
      </div>

      {/* Empty state */}
      {materials.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mb-4 text-gray-300"
            aria-hidden="true"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="12" x2="12" y2="18" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
          <h2 className="text-lg font-semibold text-black">No materials yet</h2>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-gray-500">
            Upload your first course material to start generating priming sessions
            for your students.
          </p>
        </div>
      )}

      {/* Materials list grouped by lecture */}
      {materials.length > 0 && (
        <div className="space-y-6">
          {Object.entries(groupedMaterials).map(([lectureName, lectureMaterials]) => (
            <div key={lectureName}>
              <h3 className="mb-3 text-sm font-semibold text-gray-700">
                {lectureName}
              </h3>
              <div className="space-y-3">
                {lectureMaterials.map((material) => {
                  const session = getSessionStatusForMaterial(material.id);
                  return (
                    <Card key={material.id} className="flex items-center gap-4 p-4">
                      {/* File icon */}
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-gray-600"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      </div>

                      {/* File info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-black truncate">
                          {material.file_name}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-gray-500">
                            {formatFileSize(material.file_size)} · Uploaded{" "}
                            {formatDate(material.uploaded_at)}
                          </p>
                          {session && <SessionStatusBadge status={session.status} />}
                        </div>
                      </div>

                      {/* Actions */}
                      <button
                        onClick={() => handleDelete(material.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Delete material"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Session Status Badge                                               */
/* ------------------------------------------------------------------ */

function SessionStatusBadge({
  status,
}: Readonly<{ status: "generating" | "completed" | "failed" }>) {
  const config = {
    generating: {
      label: "Generating...",
      className: "bg-amber-100 text-amber-800",
    },
    completed: {
      label: "Session Ready",
      className: "bg-green-100 text-green-800",
    },
    failed: {
      label: "Failed",
      className: "bg-red-100 text-red-800",
    },
  };

  const { label, className } = config[status];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {status === "generating" && (
        <svg
          className="h-3 w-3 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        >
          <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
        </svg>
      )}
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Students Tab                                                       */
/* ------------------------------------------------------------------ */

interface EnrolledStudent {
  id: string;
  full_name: string;
  email: string;
  profile_image_url: string | null;
  enrolled_at: string;
}

interface StudentsTabProps {
  courseId: string;
  invitationCode: string;
}

function StudentsTab({ courseId, invitationCode }: Readonly<StudentsTabProps>) {
  const [copied, setCopied] = useState(false);
  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStudents = useCallback(async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}/students`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
      }
    } catch (err) {
      console.error("Failed to fetch students:", err);
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch
  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(invitationCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: do nothing
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div>
      {/* Invitation code card */}
      <Card className="mb-8 flex items-center gap-4">
        <div className="flex-1">
          <p className="text-sm text-gray-500">Invitation Code</p>
          <p className="mt-1 font-mono text-lg font-semibold tracking-widest text-black">
            {invitationCode}
          </p>
        </div>
        <button
          onClick={handleCopy}
          title="Copy to clipboard"
          className={`flex h-9 w-9 items-center justify-center rounded-md transition-colors ${
            copied
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-black"
          }`}
        >
          {copied ? (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>
        <Button variant="secondary" size="sm" disabled>
          Generate New
        </Button>
      </Card>

      {/* Students list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-sm text-gray-400">Loading students...</p>
        </div>
      ) : students.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mb-4 text-gray-300"
            aria-hidden="true"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <h2 className="text-lg font-semibold text-black">
            No students enrolled yet
          </h2>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-gray-500">
            Share the invitation code with your students so they can enroll in
            this course.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {students.map((student) => (
            <Card key={student.id} className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-sm font-semibold text-white overflow-hidden">
                {student.profile_image_url ? (
                  <img
                    src={student.profile_image_url}
                    alt={student.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getInitials(student.full_name)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-black truncate">
                  {student.full_name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {student.email}
                </p>
              </div>
              <p className="text-xs text-gray-400">
                Enrolled {formatDate(student.enrolled_at)}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sessions Tab                                                       */
/* ------------------------------------------------------------------ */

interface SessionsTabProps {
  courseId: string;
  sessions: PrimingSessionListItem[];
  isLoading: boolean;
  onRefresh: () => void;
}

function SessionsTab({
  courseId,
  sessions,
  isLoading,
  onRefresh,
}: Readonly<SessionsTabProps>) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignments, setAssignments] = useState<SessionAssignmentWithSession[]>([]);

  const fetchAssignments = useCallback(async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}/assignments`);
      if (res.ok) {
        const data = await res.json();
        setAssignments(data.assignments || []);
      }
    } catch (err) {
      console.error("Failed to fetch assignments:", err);
    }
  }, [courseId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch
  useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

  const assignedSessionIds = new Set(assignments.map((a) => a.session_id));

  const getAssignmentForSession = (sessionId: string) => {
    return assignments.find((a) => a.session_id === sessionId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatDueDate = (dateString: string) => {
    return new Date(dateString + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleSessionCreated = () => {
    setTimeout(onRefresh, 1000);
  };

  const handleAssigned = () => {
    fetchAssignments();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-gray-400">Loading sessions...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Create Session + Assign buttons */}
      <div className="mb-6 flex items-center justify-end gap-3">
        <Button
          variant="secondary"
          onClick={() => setShowAssignModal(true)}
          iconBefore={
            <svg
              width="16"
              height="16"
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
          }
        >
          Assign Session
        </Button>
        <Button
          onClick={() => setShowCreateModal(true)}
          iconBefore={
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          }
        >
          Create Priming Session
        </Button>
      </div>

      <CreateSessionModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        courseId={courseId}
        onCreated={handleSessionCreated}
      />

      <AssignSessionModal
        open={showAssignModal}
        onOpenChange={setShowAssignModal}
        courseId={courseId}
        sessions={sessions}
        assignedSessionIds={assignedSessionIds}
        onAssigned={handleAssigned}
      />

      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mb-4 text-gray-300"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <polygon points="10 8 16 12 10 16 10 8" />
          </svg>
          <h2 className="text-lg font-semibold text-black">
            No priming sessions yet
          </h2>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-gray-500">
            Upload PDF materials, then click &quot;Create Priming Session&quot;
            to generate a session for a lecture group.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const sessionLabel =
              session.lecture_name ??
              session.material?.file_name ??
              "Unknown source";
            const isClickable = session.status === "completed";
            const assignment = getAssignmentForSession(session.id);

            const card = (
              <Card
                key={session.id}
                className={`flex items-center gap-4 p-4${
                  isClickable
                    ? " cursor-pointer transition-shadow hover:shadow-md"
                    : ""
                }`}
              >
                {/* Session icon */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-gray-600"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polygon points="10 8 16 12 10 16 10 8" />
                  </svg>
                </div>

                {/* Session info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-black truncate">
                    {session.title || "Generating session..."}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs text-gray-500 truncate">
                      {sessionLabel} · {formatDate(session.created_at)}
                    </p>
                    {session.duration && (
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {session.duration} min
                      </span>
                    )}
                    <SessionStatusBadge status={session.status} />
                    {assignment && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        Due {formatDueDate(assignment.due_date)}
                      </span>
                    )}
                  </div>
                  {session.status === "failed" && session.error_message && (
                    <p className="mt-1 text-xs text-red-500 truncate">
                      {session.error_message}
                    </p>
                  )}
                </div>

                {/* Arrow for completed sessions */}
                {isClickable && (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0 text-gray-400"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                )}
              </Card>
            );

            if (isClickable) {
              return (
                <Link
                  key={session.id}
                  href={`/teacher/courses/${courseId}/sessions/${session.id}`}
                >
                  {card}
                </Link>
              );
            }

            return <div key={session.id}>{card}</div>;
          })}
        </div>
      )}
    </div>
  );
}
