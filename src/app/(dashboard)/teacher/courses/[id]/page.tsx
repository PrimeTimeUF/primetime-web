"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button, Card } from "@/components";
import type { PrimingSessionListItem } from "@/lib/types/priming-session";

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
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
  }, [fetchCourse, fetchSessions]);

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

  const triggerGeneration = useCallback(
    (materialId: string) => {
      fetch(`/api/courses/${id}/materials/${materialId}/generate`, {
        method: "POST",
      }).then(() => {
        // Refresh sessions after triggering so the "generating" row shows up
        setTimeout(fetchSessions, 1000);
      }).catch((err) => {
        console.error("Failed to trigger generation:", err);
      });
    },
    [id, fetchSessions]
  );

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
              <span>0 students</span>
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
          count={0}
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
          <MaterialsTab
            courseId={id}
            sessions={sessions}
            onPdfUploaded={triggerGeneration}
          />
        )}
        {activeTab === "students" && (
          <StudentsTab invitationCode={course.invitation_code} />
        )}
        {activeTab === "sessions" && (
          <SessionsTab
            courseId={id}
            sessions={sessions}
            isLoading={sessionsLoading}
            onRetry={triggerGeneration}
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
  onPdfUploaded: (materialId: string) => void;
}

function MaterialsTab({
  courseId,
  sessions,
  onPdfUploaded,
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

      const data = await res.json();
      const material = data.material as CourseMaterial;

      // Trigger AI generation for PDFs
      if (material.file_type === "application/pdf") {
        onPdfUploaded(material.id);
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

interface StudentsTabProps {
  invitationCode: string;
}

function StudentsTab({ invitationCode }: Readonly<StudentsTabProps>) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(invitationCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: do nothing
    }
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

      {/* Empty students state */}
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
          Share the invitation code with your students so they can enroll in this
          course.
        </p>
      </div>
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
  onRetry: (materialId: string) => void;
}

function SessionsTab({
  courseId,
  sessions,
  isLoading,
  onRetry,
}: Readonly<SessionsTabProps>) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-gray-400">Loading sessions...</p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
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
          Priming sessions will be generated automatically when you upload PDF
          course materials.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => {
        const materialName = session.material?.file_name ?? "Unknown file";
        const isClickable = session.status === "completed";

        const card = (
          <Card
            key={session.id}
            className={`flex items-center gap-4 p-4${
              isClickable ? " cursor-pointer transition-shadow hover:shadow-md" : ""
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
              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-500 truncate">
                  From: {materialName} · {formatDate(session.created_at)}
                </p>
                <SessionStatusBadge status={session.status} />
              </div>
              {session.status === "failed" && session.error_message && (
                <p className="mt-1 text-xs text-red-500 truncate">
                  {session.error_message}
                </p>
              )}
            </div>

            {/* Retry button for failed sessions */}
            {session.status === "failed" && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onRetry(session.material_id)}
              >
                Retry
              </Button>
            )}

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
  );
}
