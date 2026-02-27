import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// GET /api/student/sessions/[sessionId]/results — Fetch existing result for review
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const supabase = await createClient();
    const { sessionId } = await params;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: result, error } = await supabase
      .from("student_session_results")
      .select("id, score, total_questions, completed_at")
      .eq("session_id", sessionId)
      .eq("student_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("GET result error:", error);
      return NextResponse.json(
        { error: "Failed to fetch result" },
        { status: 500 }
      );
    }

    if (!result) {
      return NextResponse.json(
        { error: "No result found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ result }, { status: 200 });
  } catch (error) {
    console.error("GET student session result error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/student/sessions/[sessionId]/results — Submit quiz answers
export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const supabase = await createClient();
    const { sessionId } = await params;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { course_id, answers } = body as {
      course_id: string;
      answers: Record<string, "a" | "b" | "c" | "d">;
    };

    if (!course_id || !answers || typeof answers !== "object") {
      return NextResponse.json(
        { error: "Missing course_id or answers" },
        { status: 400 }
      );
    }

    // Check if already completed
    const { data: existing } = await supabase
      .from("student_session_results")
      .select("id")
      .eq("session_id", sessionId)
      .eq("student_id", user.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Quiz already submitted" },
        { status: 409 }
      );
    }

    // Fetch questions for this session
    const { data: questions, error: questionsError } = await supabase
      .from("session_questions")
      .select("id, question_number, correct_answer")
      .eq("session_id", sessionId)
      .order("question_number", { ascending: true });

    if (questionsError || !questions || questions.length === 0) {
      return NextResponse.json(
        { error: "No questions found for this session" },
        { status: 404 }
      );
    }

    // Compute score
    const results = questions.map((q) => {
      const selected = answers[q.id] || null;
      const isCorrect = selected === q.correct_answer;
      return {
        question_id: q.id,
        question_number: q.question_number,
        selected,
        correct_answer: q.correct_answer,
        is_correct: isCorrect,
      };
    });

    const score = results.filter((r) => r.is_correct).length;
    const totalQuestions = questions.length;

    // Insert result
    const { error: insertError } = await supabase
      .from("student_session_results")
      .insert({
        student_id: user.id,
        session_id: sessionId,
        course_id,
        score,
        total_questions: totalQuestions,
      });

    if (insertError) {
      console.error("Insert result error:", insertError);
      return NextResponse.json(
        { error: "Failed to save result" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { score, total_questions: totalQuestions, results },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST student session result error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
