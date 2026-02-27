import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
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

    const { data: results, error: resultsError } = await supabase
      .from("student_session_results")
      .select(
        "id, student_id, session_id, course_id, score, total_questions, completed_at, session:priming_sessions(title, lecture_name), course:courses(title, course_code)"
      )
      .eq("student_id", user.id)
      .order("completed_at", { ascending: false });

    if (resultsError) {
      console.error("Results fetch error:", resultsError);
      return NextResponse.json(
        { error: "Failed to fetch results" },
        { status: 500 }
      );
    }

    const rows = results ?? [];

    const total_sessions_completed = rows.length;
    let average_score_percentage = 0;
    let best_score_percentage = 0;

    if (total_sessions_completed > 0) {
      const percentages = rows.map(
        (r) => (r.score / r.total_questions) * 100
      );
      average_score_percentage = Math.round(
        percentages.reduce((sum, p) => sum + p, 0) / percentages.length
      );
      best_score_percentage = Math.round(Math.max(...percentages));
    }

    return NextResponse.json(
      {
        results: rows,
        summary: {
          total_sessions_completed,
          average_score_percentage,
          best_score_percentage,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/student/results error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
