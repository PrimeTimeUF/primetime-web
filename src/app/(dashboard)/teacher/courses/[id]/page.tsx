"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CreateSessionModal, AssignSessionModal } from "@/components";
import type { PrimingSessionListItem } from "@/lib/types/priming-session";
import type { SessionAssignmentWithSession } from "@/lib/types/session-assignment";
import { useDashboardTheme } from "../../dashboard-theme-context";
import { BrutalistCard, BrutalistButton, BrutalistTab, BrutalistBadge, SectionLabel, themeTokens } from "@/components/ui/dashboard-primitives";

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
  const { isDark } = useDashboardTheme();
  const t = themeTokens(isDark);
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
      if (res.ok) { const data = await res.json(); setStudentCount(data.count ?? 0); }
    } catch (err) { console.error("Failed to fetch student count:", err); }
  }, [id]);

  const fetchCourse = useCallback(async () => {
    setError("");
    try {
      const res = await fetch(`/api/courses/${id}`);
      if (!res.ok) { const data = await res.json(); setError(data.error || "Failed to load course."); return; }
      const data = await res.json();
      setCourse(data.course);
    } catch { setError("Something went wrong. Please try again."); } finally { setIsLoading(false); }
  }, [id]);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch(`/api/courses/${id}/sessions`);
      if (res.ok) { const data = await res.json(); setSessions(data.sessions || []); }
    } catch (err) { console.error("Failed to fetch sessions:", err); } finally { setSessionsLoading(false); }
  }, [id]);

  useEffect(() => { fetchCourse(); fetchSessions(); fetchStudentCount(); }, [fetchCourse, fetchSessions, fetchStudentCount]);

  useEffect(() => {
    const hasGenerating = sessions.some((s) => s.status === "generating");
    if (hasGenerating) { pollRef.current = setInterval(fetchSessions, 5000); }
    else if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [sessions, fetchSessions]);

  if (isLoading) {
    return <p className={`font-mono text-xs ${t.textDim} tracking-wider py-20 text-center`}>LOADING COURSE...</p>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className={`font-mono text-xs ${isDark ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
        <Link href="/teacher" className={`mt-4 font-mono text-xs ${t.textMid} ${isDark ? 'hover:text-white' : 'hover:text-black'} tracking-wider`}>BACK TO DASHBOARD</Link>
      </div>
    );
  }

  if (!course) return null;

  return (
    <div>
      {/* Back link */}
      <Link href="/teacher" className={`mb-6 inline-flex items-center gap-2 font-mono text-xs ${t.textMid} ${isDark ? 'hover:text-white' : 'hover:text-black'} transition-colors tracking-wider`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
        </svg>
        BACK TO DASHBOARD
      </Link>

      <SectionLabel num="002" label="COURSE DETAIL" isDark={isDark} />

      {/* Course header */}
      <div className="flex items-start justify-between gap-6 mb-8">
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center border ${t.border} font-mono text-lg ${t.text}`}>
            &#128218;
          </div>
          <div>
            <h1 className={`font-mono text-xl lg:text-2xl font-bold tracking-wider ${t.text}`}>
              {course.title.toUpperCase()}
            </h1>
            <div className={`mt-1 flex items-center gap-3 font-mono text-xs ${t.textMid} tracking-wider`}>
              <span>{course.course_code}</span>
              <span className={`${isDark ? 'text-white/30' : 'text-black/20'}`}>{"//"}
</span>
              <span>{course.semester}</span>
              <span className={`${isDark ? 'text-white/30' : 'text-black/20'}`}>{"//"}
</span>
              <span>{studentCount} STUDENT{studentCount !== 1 ? "S" : ""}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={`flex gap-0 border-b ${t.border}`}>
        <BrutalistTab isDark={isDark} label="MATERIALS" count={0} active={activeTab === "materials"} onClick={() => setActiveTab("materials")} />
        <BrutalistTab isDark={isDark} label="STUDENTS" count={studentCount} active={activeTab === "students"} onClick={() => setActiveTab("students")} />
        <BrutalistTab isDark={isDark} label="SESSIONS" count={sessions.length} active={activeTab === "sessions"} onClick={() => setActiveTab("sessions")} />
      </div>

      {/* Tab content */}
      <div className="py-8">
        {activeTab === "materials" && <MaterialsTab courseId={id} sessions={sessions} isDark={isDark} />}
        {activeTab === "students" && <StudentsTab courseId={id} invitationCode={course.invitation_code} isDark={isDark} />}
        {activeTab === "sessions" && <SessionsTab courseId={id} sessions={sessions} isLoading={sessionsLoading} onRefresh={fetchSessions} isDark={isDark} />}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Session Status Badge                                               */
/* ------------------------------------------------------------------ */

function SessionStatusBadge({ status, isDark }: Readonly<{ status: "generating" | "completed" | "failed"; isDark: boolean }>) {
  const variantMap = { generating: "warning" as const, completed: "success" as const, failed: "error" as const };
  const labelMap = { generating: "GENERATING", completed: "READY", failed: "FAILED" };
  return (
    <BrutalistBadge
      isDark={isDark}
      variant={variantMap[status]}
      icon={status === "generating" ? (
        <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
        </svg>
      ) : undefined}
    >
      {labelMap[status]}
    </BrutalistBadge>
  );
}

/* ------------------------------------------------------------------ */
/*  Materials Tab                                                      */
/* ------------------------------------------------------------------ */

interface MaterialsTabProps {
  courseId: string;
  sessions: PrimingSessionListItem[];
  isDark: boolean;
}

function MaterialsTab({ courseId, sessions, isDark }: Readonly<MaterialsTabProps>) {
  const t = themeTokens(isDark);
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
        const lectures = Array.from(new Set(data.materials.map((m: CourseMaterial) => m.lecture_name).filter((name: string | null) => name !== null))) as string[];
        setExistingLectures(lectures);
      }
    } catch (error) { console.error("Failed to fetch materials:", error); } finally { setIsLoading(false); }
  }, [courseId]);

  useEffect(() => { fetchMaterials(); }, [fetchMaterials]);

  const handleUploadClick = () => { setShowUploadModal(true); };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 26214400) { setUploadError("File size must be less than 25MB"); return; }
  };

  const handleUploadSubmit = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    if (!lectureName.trim()) { setUploadError("Please enter a lecture name"); return; }
    setIsUploading(true); setUploadError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("lectureName", lectureName.trim());
      const res = await fetch(`/api/courses/${courseId}/materials`, { method: "POST", body: formData });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "Upload failed"); }
      await fetchMaterials();
      setShowUploadModal(false); setLectureName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError(error instanceof Error ? error.message : "Upload failed");
    } finally { setIsUploading(false); }
  };

  const handleDelete = async (materialId: string) => {
    if (!confirm("Are you sure you want to delete this material?")) return;
    try {
      const res = await fetch(`/api/courses/${courseId}/materials?materialId=${materialId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      await fetchMaterials();
    } catch (error) { console.error("Delete error:", error); alert("Failed to delete material"); }
  };

  const getSessionStatusForMaterial = (materialId: string) => sessions.find((s) => s.material_id === materialId);

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown size";
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  if (isLoading) {
    return <p className={`font-mono text-xs ${t.textDim} tracking-wider py-16 text-center`}>LOADING MATERIALS...</p>;
  }

  const groupedMaterials = materials.reduce((acc, material) => {
    const lecture = material.lecture_name || "Ungrouped";
    if (!acc[lecture]) acc[lecture] = [];
    acc[lecture].push(material);
    return acc;
  }, {} as Record<string, CourseMaterial[]>);

  return (
    <div>
      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-md border ${t.border} ${isDark ? 'bg-black' : 'bg-white'} p-6`}>
            <h3 className={`mb-4 font-mono text-sm font-bold ${t.text} tracking-[0.2em]`}>UPLOAD MATERIAL</h3>
            <div className="mb-4">
              <label className={`mb-2 block font-mono text-[10px] ${t.textDim} tracking-[0.25em] uppercase`}>SELECT FILE</label>
              <input ref={fileInputRef} type="file" onChange={handleFileChange} className={`w-full border ${t.border} bg-transparent ${t.text} font-mono text-xs p-2`} accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.mov" />
            </div>
            <div className="mb-4">
              <label className={`mb-2 block font-mono text-[10px] ${t.textDim} tracking-[0.25em] uppercase`}>LECTURE NAME</label>
              {existingLectures.length > 0 ? (
                <>
                  <select value={lectureName} onChange={(e) => setLectureName(e.target.value)} className={`w-full border ${t.border} bg-transparent ${t.text} font-mono text-xs p-2 mb-2`}>
                    <option value="">-- SELECT EXISTING --</option>
                    {existingLectures.map((lecture) => (<option key={lecture} value={lecture}>{lecture}</option>))}
                  </select>
                  <p className={`my-2 text-center font-mono text-[10px] ${t.textDim}`}>OR</p>
                  <input type="text" value={lectureName} onChange={(e) => setLectureName(e.target.value)} placeholder="Type a new lecture name" className={`w-full border ${t.border} bg-transparent ${t.text} font-mono text-xs p-2`} />
                </>
              ) : (
                <input type="text" value={lectureName} onChange={(e) => setLectureName(e.target.value)} placeholder="Enter lecture name" className={`w-full border ${t.border} bg-transparent ${t.text} font-mono text-xs p-2`} />
              )}
            </div>
            {uploadError && <p className={`mb-4 font-mono text-xs ${isDark ? 'text-red-400' : 'text-red-600'}`}>{uploadError}</p>}
            <div className="flex justify-end gap-3">
              <BrutalistButton isDark={isDark} variant="secondary" onClick={() => { setShowUploadModal(false); setLectureName(""); setUploadError(""); if (fileInputRef.current) fileInputRef.current.value = ""; }} disabled={isUploading}>CANCEL</BrutalistButton>
              <BrutalistButton isDark={isDark} onClick={handleUploadSubmit} disabled={isUploading || !fileInputRef.current?.files?.[0]}>{isUploading ? "UPLOADING..." : "UPLOAD"}</BrutalistButton>
            </div>
          </div>
        </div>
      )}

      {/* Upload button */}
      <div className="mb-6 flex items-center justify-end">
        <BrutalistButton isDark={isDark} onClick={handleUploadClick} disabled={isUploading} iconBefore={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        }>UPLOAD MATERIAL</BrutalistButton>
      </div>

      {/* Empty state */}
      {materials.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className={`flex h-14 w-14 items-center justify-center border ${t.border} mb-4`}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={t.textMid} aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="12" x2="12" y2="18" /><line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          </div>
          <h2 className={`font-mono text-sm font-bold ${t.text} tracking-wider`}>NO MATERIALS YET</h2>
          <p className={`mt-2 max-w-xs font-mono text-xs ${t.textMid} leading-relaxed`}>Upload your first course material to start generating priming sessions.</p>
        </div>
      )}

      {/* Materials list */}
      {materials.length > 0 && (
        <div className="space-y-6">
          {Object.entries(groupedMaterials).map(([lecName, lectureMaterials]) => (
            <div key={lecName}>
              <h3 className={`mb-3 font-mono text-xs font-bold ${t.textMid} tracking-[0.2em] uppercase`}>{lecName}</h3>
              <div className="space-y-2">
                {lectureMaterials.map((material) => {
                  const session = getSessionStatusForMaterial(material.id);
                  return (
                    <BrutalistCard key={material.id} isDark={isDark} className="flex items-center gap-4 !p-4">
                      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center border ${t.border}`}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={t.textMid}>
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-mono text-xs font-medium ${t.text} truncate tracking-wider`}>{material.file_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className={`font-mono text-[10px] ${t.textDim}`}>{formatFileSize(material.file_size)} {"//"}  {formatDate(material.uploaded_at)}</p>
                          {session && <SessionStatusBadge status={session.status} isDark={isDark} />}
                        </div>
                      </div>
                      <button onClick={() => handleDelete(material.id)} className={`flex h-8 w-8 items-center justify-center ${t.textMid} ${isDark ? 'hover:text-red-400 hover:bg-red-500/10' : 'hover:text-red-600 hover:bg-red-50'} transition-colors`} title="Delete material">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </BrutalistCard>
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
  isDark: boolean;
}

function StudentsTab({ courseId, invitationCode, isDark }: Readonly<StudentsTabProps>) {
  const t = themeTokens(isDark);
  const [copied, setCopied] = useState(false);
  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStudents = useCallback(async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}/students`);
      if (res.ok) { const data = await res.json(); setStudents(data.students || []); }
    } catch (err) { console.error("Failed to fetch students:", err); } finally { setIsLoading(false); }
  }, [courseId]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(invitationCode); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* fallback */ }
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div>
      {/* Invitation code card */}
      <BrutalistCard isDark={isDark} className="mb-8 flex items-center gap-4">
        <div className="flex-1">
          <p className={`font-mono text-[10px] ${t.textDim} tracking-[0.25em] uppercase`}>INVITATION CODE</p>
          <p className={`mt-1 font-mono text-lg font-bold tracking-widest ${t.text}`}>{invitationCode}</p>
        </div>
        <button onClick={handleCopy} title="Copy to clipboard"
          className={`flex h-9 w-9 items-center justify-center border transition-colors ${copied ? (isDark ? 'border-green-500/40 text-green-400' : 'border-green-600/50 text-green-700') : `${t.border} ${t.textMid} ${isDark ? 'hover:text-white hover:border-white/30' : 'hover:text-black hover:border-black/25'}`}`}>
          {copied ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
          )}
        </button>
        <BrutalistButton isDark={isDark} variant="secondary" size="sm" disabled>GENERATE NEW</BrutalistButton>
      </BrutalistCard>

      {/* Students list */}
      {isLoading ? (
        <p className={`font-mono text-xs ${t.textDim} tracking-wider py-16 text-center`}>LOADING STUDENTS...</p>
      ) : students.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className={`flex h-14 w-14 items-center justify-center border ${t.border} mb-4`}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={t.textMid}>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h2 className={`font-mono text-sm font-bold ${t.text} tracking-wider`}>NO STUDENTS ENROLLED</h2>
          <p className={`mt-2 max-w-xs font-mono text-xs ${t.textMid} leading-relaxed`}>Share the invitation code with your students so they can enroll.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {students.map((student) => (
            <BrutalistCard key={student.id} isDark={isDark} className="flex items-center gap-4 !p-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center border ${t.borderMid} font-mono text-xs font-bold ${t.text} overflow-hidden`}>
                {student.profile_image_url ? (
                  <img src={student.profile_image_url} alt={student.full_name} className="w-full h-full object-cover" />
                ) : (
                  getInitials(student.full_name)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-mono text-xs font-medium ${t.text} truncate tracking-wider`}>{student.full_name.toUpperCase()}</p>
                <p className={`font-mono text-[10px] ${t.textDim} truncate`}>{student.email}</p>
              </div>
              <p className={`font-mono text-[10px] ${t.textDim}`}>ENROLLED {formatDate(student.enrolled_at).toUpperCase()}</p>
            </BrutalistCard>
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
  isDark: boolean;
}

function SessionsTab({ courseId, sessions, isLoading, onRefresh, isDark }: Readonly<SessionsTabProps>) {
  const t = themeTokens(isDark);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignments, setAssignments] = useState<SessionAssignmentWithSession[]>([]);

  const fetchAssignments = useCallback(async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}/assignments`);
      if (res.ok) { const data = await res.json(); setAssignments(data.assignments || []); }
    } catch (err) { console.error("Failed to fetch assignments:", err); }
  }, [courseId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch
  useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

  const assignedSessionIds = new Set(assignments.map((a) => a.session_id));
  const getAssignmentForSession = (sessionId: string) => assignments.find((a) => a.session_id === sessionId);

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
  const formatDueDate = (dateString: string) => new Date(dateString + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const handleSessionCreated = () => { setTimeout(onRefresh, 1000); };
  const handleAssigned = () => { fetchAssignments(); };

  if (isLoading) {
    return <p className={`font-mono text-xs ${t.textDim} tracking-wider py-16 text-center`}>LOADING SESSIONS...</p>;
  }

  return (
    <div>
      {/* Action buttons */}
      <div className="mb-6 flex items-center justify-end gap-3">
        <BrutalistButton isDark={isDark} variant="secondary" onClick={() => setShowAssignModal(true)} iconBefore={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        }>ASSIGN SESSION</BrutalistButton>
        <BrutalistButton isDark={isDark} onClick={() => setShowCreateModal(true)} iconBefore={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        }>CREATE SESSION</BrutalistButton>
      </div>

      <CreateSessionModal open={showCreateModal} onOpenChange={setShowCreateModal} courseId={courseId} onCreated={handleSessionCreated} />
      <AssignSessionModal open={showAssignModal} onOpenChange={setShowAssignModal} courseId={courseId} sessions={sessions} assignedSessionIds={assignedSessionIds} onAssigned={handleAssigned} />

      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className={`flex h-14 w-14 items-center justify-center border ${t.border} mb-4`}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={t.textMid}>
              <circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" />
            </svg>
          </div>
          <h2 className={`font-mono text-sm font-bold ${t.text} tracking-wider`}>NO SESSIONS YET</h2>
          <p className={`mt-2 max-w-xs font-mono text-xs ${t.textMid} leading-relaxed`}>Upload PDF materials, then create a priming session for a lecture group.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => {
            const sessionLabel = session.lecture_name ?? session.material?.file_name ?? "Unknown source";
            const isClickable = session.status === "completed";
            const assignment = getAssignmentForSession(session.id);

            const card = (
              <BrutalistCard key={session.id} isDark={isDark} className={`flex items-center gap-4 !p-4 ${isClickable ? `cursor-pointer ${isDark ? 'hover:border-white/30' : 'hover:border-black/25'}` : ''}`}>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center border ${t.border}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={t.textMid}>
                    <circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-mono text-xs font-medium ${t.text} truncate tracking-wider`}>{session.title?.toUpperCase() || "GENERATING SESSION..."}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <p className={`font-mono text-[10px] ${t.textDim} truncate`}>{sessionLabel} {"//"}  {formatDate(session.created_at)}</p>
                    {session.duration && <BrutalistBadge isDark={isDark} variant="info">{session.duration} MIN</BrutalistBadge>}
                    <SessionStatusBadge status={session.status} isDark={isDark} />
                    {assignment && (
                      <BrutalistBadge isDark={isDark} variant="purple" icon={
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                      }>DUE {formatDueDate(assignment.due_date).toUpperCase()}</BrutalistBadge>
                    )}
                  </div>
                  {session.status === "failed" && session.error_message && (
                    <p className={`mt-1 font-mono text-[10px] ${isDark ? 'text-red-400' : 'text-red-600'} truncate`}>{session.error_message}</p>
                  )}
                </div>
                {isClickable && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${t.textDim}`}>
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                )}
              </BrutalistCard>
            );

            if (isClickable) {
              return <Link key={session.id} href={`/teacher/courses/${courseId}/sessions/${session.id}`}>{card}</Link>;
            }
            return <div key={session.id}>{card}</div>;
          })}
        </div>
      )}
    </div>
  );
}
