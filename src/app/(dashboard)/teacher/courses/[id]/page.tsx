"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button, Card } from "@/components";

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
}

type TabKey = "materials" | "students" | "sessions";

export default function TeacherCourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("materials");

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

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

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
          count={0}
          active={activeTab === "sessions"}
          onClick={() => setActiveTab("sessions")}
        />
      </div>

      {/* Tab content */}
      <div className="py-8">
        {activeTab === "materials" && <MaterialsTab courseId={id} />}
        {activeTab === "students" && (
          <StudentsTab invitationCode={course.invitation_code} />
        )}
        {activeTab === "sessions" && <SessionsTab />}
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
}

function MaterialsTab({ courseId }: Readonly<MaterialsTabProps>) {
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMaterials = useCallback(async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}/materials`);
      if (res.ok) {
        const data = await res.json();
        setMaterials(data.materials || []);
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
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (25MB)
    const MAX_SIZE = 26214400;
    if (file.size > MAX_SIZE) {
      setUploadError("File size must be less than 25MB");
      return;
    }

    setIsUploading(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

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

      // Reset file input
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

  return (
    <div>
      {/* Upload button and error */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          {uploadError && (
            <p className="text-sm text-red-500">{uploadError}</p>
          )}
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.mov"
          />
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
            {isUploading ? "Uploading..." : "Upload Material"}
          </Button>
        </div>
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

      {/* Materials list */}
      {materials.length > 0 && (
        <div className="space-y-3">
          {materials.map((material) => (
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
                <p className="text-xs text-gray-500">
                  {formatFileSize(material.file_size)} · Uploaded {formatDate(material.uploaded_at)}
                </p>
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
          ))}
        </div>
      )}
    </div>
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

function SessionsTab() {
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
        Priming sessions will be generated automatically when you upload course
        materials.
      </p>
    </div>
  );
}
