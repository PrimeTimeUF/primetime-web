import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { extractTextFromPdf } from "@/lib/pdf";
import { generatePrimingSession } from "@/lib/anthropic";
import { NextResponse } from "next/server";

export const maxDuration = 120;

interface GenerateRequestBody {
  lectureName: string;
  duration: 10 | 15 | 30;
}

const VALID_DURATIONS = new Set([10, 15, 30]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: courseId } = await params;

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

    // Parse request body
    const body = (await request.json()) as GenerateRequestBody;
    const { lectureName, duration } = body;

    if (!lectureName || typeof lectureName !== "string") {
      return NextResponse.json(
        { error: "lectureName is required" },
        { status: 400 }
      );
    }

    if (!VALID_DURATIONS.has(duration)) {
      return NextResponse.json(
        { error: "duration must be 10, 15, or 30" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Fetch all PDF materials matching this lecture name in the course
    const { data: materials, error: materialsError } = await admin
      .from("course_materials")
      .select("id, file_url, file_name, file_type")
      .eq("course_id", courseId)
      .eq("lecture_name", lectureName)
      .eq("file_type", "application/pdf")
      .order("uploaded_at", { ascending: true });

    if (materialsError) {
      console.error("Materials fetch error:", materialsError);
      return NextResponse.json(
        { error: "Failed to fetch materials" },
        { status: 500 }
      );
    }

    if (!materials || materials.length === 0) {
      return NextResponse.json(
        { error: "No PDF materials found for this lecture" },
        { status: 404 }
      );
    }

    // Create session row with 'generating' status
    const { data: session, error: insertError } = await admin
      .from("priming_sessions")
      .insert({
        course_id: courseId,
        lecture_name: lectureName,
        duration,
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
    runGeneration(
      admin,
      sessionId,
      materials.map((m) => ({ fileUrl: m.file_url, fileName: m.file_name })),
      lectureName,
      duration as 10 | 15 | 30
    );

    return NextResponse.json(
      { message: "Generation started", session_id: sessionId },
      { status: 202 }
    );
  } catch (error) {
    console.error("POST sessions/generate error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function runGeneration(
  admin: ReturnType<typeof createAdminClient>,
  sessionId: string,
  files: { fileUrl: string; fileName: string }[],
  lectureName: string,
  duration: 10 | 15 | 30
) {
  try {
    // Download and extract text from all PDFs
    const textParts: string[] = [];

    for (const file of files) {
      const { data: fileData, error: downloadError } = await admin.storage
        .from("course-materials")
        .download(file.fileUrl);

      if (downloadError || !fileData) {
        throw new Error(
          `Failed to download file ${file.fileName}: ${downloadError?.message}`
        );
      }

      const buffer = Buffer.from(await fileData.arrayBuffer());
      const text = await extractTextFromPdf(buffer);
      textParts.push(`--- ${file.fileName} ---\n${text}`);
    }

    const combinedText = textParts.join("\n\n");

    // Generate with Claude
    const result = await generatePrimingSession(
      combinedText,
      lectureName,
      duration
    );

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
