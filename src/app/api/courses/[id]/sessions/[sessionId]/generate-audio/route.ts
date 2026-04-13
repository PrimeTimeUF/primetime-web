import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/lib/supabase-admin";
import {
  contentToNarrationText,
  synthesizeSpeech,
  uploadAudioToStorage,
} from "@/lib/tts";
import { NextResponse, after } from "next/server";
import type { PrimingSessionContent } from "@/lib/types/priming-session";

export const maxDuration = 120;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: courseId, sessionId } = await params;

    // --- Auth check ---
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // --- Verify teacher owns this course ---
    const { data: course } = await supabase
      .from("courses")
      .select("teacher_id")
      .eq("id", courseId)
      .single();

    if (!course || course.teacher_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admin = createAdminClient();

    // --- Fetch session ---
    const { data: session, error: sessionError } = await admin
      .from("priming_sessions")
      .select("id, status, content, audio_url, audio_status")
      .eq("id", sessionId)
      .eq("course_id", courseId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    if (session.status !== "completed") {
      return NextResponse.json(
        { error: "Session must be completed before generating audio" },
        { status: 400 }
      );
    }

    // --- Cache check: return existing URL if already generated ---
    if (session.audio_url && session.audio_status === "ready") {
      return NextResponse.json(
        { audio_url: session.audio_url, cached: true },
        { status: 200 }
      );
    }

    // --- Mark as generating ---
    await admin
      .from("priming_sessions")
      .update({ audio_status: "generating" })
      .eq("id", sessionId);

    // --- Run TTS after response — Vercel keeps the function alive via after() ---
    after(
      runTtsGeneration(
        admin,
        sessionId,
        session.content as PrimingSessionContent
      )
    );

    return NextResponse.json(
      { message: "Audio generation started", session_id: sessionId },
      { status: 202 }
    );
  } catch (error) {
    console.error("POST generate-audio error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function runTtsGeneration(
  admin: ReturnType<typeof createAdminClient>,
  sessionId: string,
  content: PrimingSessionContent
) {
  try {
    // 1. Convert structured content to narration text
    const narrationText = contentToNarrationText(content);

    // 2. Call Google TTS API
    const audioBuffer = await synthesizeSpeech(narrationText);

    // 3. Upload to Supabase Storage
    const audioUrl = await uploadAudioToStorage(admin, sessionId, audioBuffer);

    // 4. Save URL to DB
    await admin
      .from("priming_sessions")
      .update({ audio_url: audioUrl, audio_status: "ready" })
      .eq("id", sessionId);
  } catch (error) {
    console.error("TTS generation failed for session", sessionId, error);
    await admin
      .from("priming_sessions")
      .update({ audio_status: "failed" })
      .eq("id", sessionId);
  }
}
