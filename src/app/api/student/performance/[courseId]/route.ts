import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import type {
  StudentCoursePerformanceDetail,
  StudentSessionPerformance,
} from "@/lib/types/student-performance";

interface ResultRow {
  session_id: string;
  score: number;
  total_questions: number;
  completed_at: string;
}

function pct(score: number, total: number): number {
  return total > 0 ? (score / total) * 100 : 0;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profileError || profile.role !== "student") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: enrollment, error: enrollmentError } = await supabase
      .from("course_enrollments")
      .select("id")
      .eq("student_id", user.id)
      .eq("course_id", courseId)
      .maybeSingle();

    if (enrollmentError || !enrollment) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id, title, course_code, semester")
      .eq("id", courseId)
      .single();
    if (courseError || !course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const [assignmentsRes, resultsRes] = await Promise.all([
      supabase
        .from("session_assignments")
        .select("id, session_id, assigned_at, due_date, session:priming_sessions(id, title, lecture_name)")
        .eq("course_id", courseId)
        .order("assigned_at", { ascending: false }),
      supabase
        .from("student_session_results")
        .select("session_id, score, total_questions, completed_at")
        .eq("student_id", user.id)
        .eq("course_id", courseId),
    ]);

    const assignments = assignmentsRes.data ?? [];
    const results = (resultsRes.data ?? []) as ResultRow[];
    const resultsBySession = new Map(results.map((r) => [r.session_id, r]));

    const sessions: StudentSessionPerformance[] = assignments.map((a) => {
      const raw = a.session as unknown as
        | { id: string; title: string | null; lecture_name: string | null }
        | { id: string; title: string | null; lecture_name: string | null }[]
        | null;
      const session = Array.isArray(raw) ? raw[0] ?? null : raw;
      const result = resultsBySession.get(a.session_id) ?? null;
      return {
        session_id: a.session_id,
        title: session?.title ?? null,
        lecture_name: session?.lecture_name ?? null,
        assigned_at: a.assigned_at,
        due_date: a.due_date,
        completed: result !== null,
        completed_at: result?.completed_at ?? null,
        score: result?.score ?? null,
        total_questions: result?.total_questions ?? null,
        score_percentage:
          result !== null ? Math.round(pct(result.score, result.total_questions)) : null,
      };
    });

    const completedCount = results.length;
    const scores = results.map((r) => pct(r.score, r.total_questions));
    const avg =
      scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const best = scores.length > 0 ? Math.round(Math.max(...scores)) : 0;

    const detail: StudentCoursePerformanceDetail = {
      course_id: course.id,
      title: course.title,
      course_code: course.course_code,
      semester: course.semester,
      sessions_assigned: assignments.length,
      sessions_completed: completedCount,
      completion_rate_percentage:
        assignments.length > 0 ? Math.round((completedCount / assignments.length) * 100) : 0,
      avg_score_percentage: avg,
      best_score_percentage: best,
      sessions,
    };

    return NextResponse.json({ detail });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
