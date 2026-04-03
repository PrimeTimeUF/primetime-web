import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import type { TeacherCourseAnalyticsDetail, TeacherSessionStats, TeacherStudentStats } from "@/lib/types/teacher-analytics";

interface ResultRow { session_id: string; student_id: string; score: number; total_questions: number; completed_at: string }

function avgPct(rows: { score: number; total_questions: number }[]): number {
  if (rows.length === 0) return 0;
  const sum = rows.reduce((s, r) => s + (r.total_questions > 0 ? (r.score / r.total_questions) * 100 : 0), 0);
  return Math.round(sum / rows.length);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile, error: profileError } = await supabase.from("users").select("role").eq("id", user.id).single();
    if (profileError || profile.role !== "teacher") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { data: course, error: courseError } = await supabase
      .from("courses").select("id, title, course_code").eq("id", courseId).eq("teacher_id", user.id).single();
    if (courseError || !course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    const [enrollmentsRes, assignmentsRes, resultsRes] = await Promise.all([
      supabase.from("course_enrollments").select("student_id").eq("course_id", courseId),
      supabase.from("session_assignments")
        .select("id, session_id, assigned_at, due_date, session:priming_sessions(id, title, lecture_name)")
        .eq("course_id", courseId).order("assigned_at", { ascending: false }),
      supabase.from("student_session_results")
        .select("session_id, student_id, score, total_questions, completed_at").eq("course_id", courseId),
    ]);

    const enrollments = enrollmentsRes.data ?? [];
    const assignments = assignmentsRes.data ?? [];
    const results = (resultsRes.data ?? []) as ResultRow[];
    const enrolledCount = enrollments.length;

    // Student names
    const studentIds = [...new Set(enrollments.map((e) => e.student_id))];
    let studentMap: Record<string, string> = {};
    if (studentIds.length > 0) {
      const { data: users } = await supabase.from("users").select("id, full_name").in("id", studentIds);
      if (users) studentMap = Object.fromEntries(users.map((s) => [s.id, s.full_name ?? "Unknown"]));
    }

    // Per-session stats
    const sessions: TeacherSessionStats[] = assignments.map((a) => {
      const raw = a.session as unknown as { id: string; title: string | null; lecture_name: string | null } | { id: string; title: string | null; lecture_name: string | null }[] | null;
      const session = Array.isArray(raw) ? raw[0] ?? null : raw;
      const sr = results.filter((r) => r.session_id === a.session_id);
      return {
        session_id: a.session_id,
        title: session?.title ?? null,
        lecture_name: session?.lecture_name ?? null,
        assigned_at: a.assigned_at,
        due_date: a.due_date,
        completion_count: sr.length,
        completion_rate_percentage: enrolledCount > 0 ? Math.round((sr.length / enrolledCount) * 100) : 0,
        avg_score_percentage: avgPct(sr),
      };
    });

    // Per-student stats — group results by student_id
    const byStudent = Map.groupBy(results, (r) => r.student_id);
    const students: TeacherStudentStats[] = studentIds.map((sid) => {
      const sr = byStudent.get(sid) ?? [];
      const scores = sr.map((r) => (r.total_questions > 0 ? (r.score / r.total_questions) * 100 : 0));
      return {
        student_id: sid,
        full_name: studentMap[sid] ?? "Unknown",
        sessions_completed: sr.length,
        avg_score_percentage: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
        best_score_percentage: scores.length > 0 ? Math.round(Math.max(...scores)) : 0,
      };
    });

    const expectedCompletions = enrolledCount * assignments.length;
    const detail: TeacherCourseAnalyticsDetail = {
      course_id: course.id,
      title: course.title,
      course_code: course.course_code,
      enrolled_students: enrolledCount,
      sessions_assigned: assignments.length,
      avg_score_percentage: avgPct(results),
      completion_rate_percentage: expectedCompletions > 0 ? Math.round((results.length / expectedCompletions) * 100) : 0,
      sessions,
      students,
    };

    return NextResponse.json({ detail });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
