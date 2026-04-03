import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import type { TeacherAnalyticsOverview, TeacherCourseAnalyticsSummary } from "@/lib/types/teacher-analytics";

interface ResultRow { score: number; total_questions: number; course_id: string }

function avgPct(rows: ResultRow[]): number {
  if (rows.length === 0) return 0;
  const sum = rows.reduce((s, r) => s + (r.total_questions > 0 ? (r.score / r.total_questions) * 100 : 0), 0);
  return Math.round(sum / rows.length);
}

function completionPct(results: number, enrolled: number, assigned: number): number {
  const expected = enrolled * assigned;
  return expected > 0 ? Math.round((results / expected) * 100) : 0;
}

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile, error: profileError } = await supabase.from("users").select("role").eq("id", user.id).single();
    if (profileError || profile.role !== "teacher") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { data: courses, error: coursesError } = await supabase
      .from("courses").select("id, title, course_code").eq("teacher_id", user.id).order("created_at", { ascending: false });

    if (coursesError) return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });

    if (!courses || courses.length === 0) {
      return NextResponse.json({ overview: { total_students: 0, total_sessions_assigned: 0, overall_avg_score: 0, overall_completion_rate: 0, courses: [] } });
    }

    const courseIds = courses.map((c) => c.id);
    const [enrollmentsRes, assignmentsRes, resultsRes] = await Promise.all([
      supabase.from("course_enrollments").select("course_id, student_id").in("course_id", courseIds),
      supabase.from("session_assignments").select("id, course_id").in("course_id", courseIds),
      supabase.from("student_session_results").select("session_id, course_id, student_id, score, total_questions").in("course_id", courseIds),
    ]);

    const enrollments = enrollmentsRes.data ?? [];
    const assignments = assignmentsRes.data ?? [];
    const results = resultsRes.data ?? [];

    const courseSummaries: TeacherCourseAnalyticsSummary[] = courses.map((course) => {
      const ce = enrollments.filter((e) => e.course_id === course.id);
      const ca = assignments.filter((a) => a.course_id === course.id);
      const cr = results.filter((r) => r.course_id === course.id);
      return {
        course_id: course.id,
        title: course.title,
        course_code: course.course_code,
        enrolled_students: ce.length,
        sessions_assigned: ca.length,
        avg_score_percentage: avgPct(cr),
        completion_rate_percentage: completionPct(cr.length, ce.length, ca.length),
      };
    });

    const totalExpected = courseSummaries.reduce((s, c) => s + c.enrolled_students * c.sessions_assigned, 0);

    const overview: TeacherAnalyticsOverview = {
      total_students: new Set(enrollments.map((e) => e.student_id)).size,
      total_sessions_assigned: assignments.length,
      overall_avg_score: avgPct(results),
      overall_completion_rate: totalExpected > 0 ? Math.round((results.length / totalExpected) * 100) : 0,
      courses: courseSummaries,
    };

    return NextResponse.json({ overview });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
