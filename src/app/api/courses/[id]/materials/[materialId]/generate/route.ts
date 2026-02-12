import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { extractTextFromPdf } from "@/lib/pdf";
import { generatePrimingSession } from "@/lib/anthropic";
import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; materialId: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: courseId, materialId } = await params;

    // Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is the course teacher
    const { data: course } = await supabase
      .from("courses")
      .select("teacher_id")
      .eq("id", courseId)
      .single();

    if (!course || course.teacher_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify the material exists and belongs to this course
    const { data: material } = await supabase
      .from("course_materials")
      .select("id, file_url, file_name, file_type")
      .eq("id", materialId)
      .eq("course_id", courseId)
      .single();

    if (!material) {
      return NextResponse.json(
        { error: "Material not found" },
        { status: 404 }
      );
    }

    // Only generate for PDFs
    if (material.file_type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files can generate priming sessions" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Duplicate guard: check if a session already exists (not failed)
    const { data: existing } = await admin
      .from("priming_sessions")
      .select("id, status")
      .eq("material_id", materialId)
      .neq("status", "failed")
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { message: "Session already exists", session_id: existing.id },
        { status: 200 }
      );
    }

    // Create session row with 'generating' status
    const { data: session, error: insertError } = await admin
      .from("priming_sessions")
      .insert({
        material_id: materialId,
        course_id: courseId,
        status: "generating",
      })
      .select("id")
      .single();

    if (insertError || !session) {
      console.error("Failed to create session row:", insertError);
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 }
      );
    }

    const sessionId = session.id;

    // Run generation in the background (fire-and-forget)
    // We don't await this — the client polls for status
    runGeneration(admin, sessionId, material.file_url, material.file_name);

    return NextResponse.json(
      { message: "Generation started", session_id: sessionId },
      { status: 202 }
    );
  } catch (error) {
    console.error("POST generate error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function runGeneration(
  admin: ReturnType<typeof createAdminClient>,
  sessionId: string,
  fileUrl: string,
  fileName: string
) {
  try {
    // Download PDF from storage
    const { data: fileData, error: downloadError } = await admin.storage
      .from("course-materials")
      .download(fileUrl);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());

    // Extract text
    const pdfText = await extractTextFromPdf(buffer);

    // Generate with Claude
    const result = await generatePrimingSession(pdfText, fileName);

    // Update session to completed
    await admin
      .from("priming_sessions")
      .update({
        status: "completed",
        title: result.title,
        content: result.content,
        completed_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    // Insert questions
    const questions = result.questions.map((q) => ({
      session_id: sessionId,
      question_number: q.question_number,
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
    }));

    const { error: questionsError } = await admin
      .from("session_questions")
      .insert(questions);

    if (questionsError) {
      console.error("Failed to insert questions:", questionsError);
    }
  } catch (error) {
    console.error("Generation failed:", error);
    await admin
      .from("priming_sessions")
      .update({
        status: "failed",
        error_message:
          error instanceof Error ? error.message : "Unknown error",
      })
      .eq("id", sessionId);
  }
}
