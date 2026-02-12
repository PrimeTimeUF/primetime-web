import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// GET /api/courses/[id]/sessions/[sessionId] - Fetch a single session with questions
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: courseId, sessionId } = await params;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch session (RLS handles access control)
    const { data: session, error: sessionError } = await supabase
      .from("priming_sessions")
      .select(
        "*, material:course_materials(file_name), course:courses(title, course_code)"
      )
      .eq("id", sessionId)
      .eq("course_id", courseId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Fetch questions
    const { data: questions } = await supabase
      .from("session_questions")
      .select("*")
      .eq("session_id", sessionId)
      .order("question_number", { ascending: true });

    return NextResponse.json(
      { session, questions: questions || [] },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET session detail error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
