import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// GET /api/courses/[id]/sessions - Fetch all priming sessions for a course
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: courseId } = await params;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify access (teacher owns course or student enrolled)
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (profile.role === "teacher") {
      const { data: course } = await supabase
        .from("courses")
        .select("id")
        .eq("id", courseId)
        .eq("teacher_id", user.id)
        .single();

      if (!course) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (profile.role === "student") {
      const { data: enrollment } = await supabase
        .from("course_enrollments")
        .select("id")
        .eq("course_id", courseId)
        .eq("student_id", user.id)
        .single();

      if (!enrollment) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Fetch sessions with material file name
    const { data: sessions, error: sessionsError } = await supabase
      .from("priming_sessions")
      .select(
        "id, material_id, course_id, title, status, error_message, created_at, completed_at, material:course_materials(file_name)"
      )
      .eq("course_id", courseId)
      .order("created_at", { ascending: false });

    if (sessionsError) {
      console.error("Sessions fetch error:", sessionsError);
      return NextResponse.json(
        { error: "Failed to fetch sessions" },
        { status: 500 }
      );
    }

    return NextResponse.json({ sessions }, { status: 200 });
  } catch (error) {
    console.error("GET /api/courses/[id]/sessions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
