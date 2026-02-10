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

    const { data: enrollments, error: enrollmentsError } = await supabase
      .from("course_enrollments")
      .select("id, enrolled_at, course:courses(id, title, course_code, semester, description)")
      .eq("student_id", user.id)
      .order("enrolled_at", { ascending: false });

    if (enrollmentsError) {
      console.error("Enrollments fetch error:", enrollmentsError);
      return NextResponse.json(
        { error: "Failed to fetch enrollments" },
        { status: 500 }
      );
    }

    return NextResponse.json({ enrollments }, { status: 200 });
  } catch (error) {
    console.error("GET /api/enrollments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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

    const body = await request.json();
    const { invitationCode } = body;

    if (!invitationCode || typeof invitationCode !== "string" || !invitationCode.trim()) {
      return NextResponse.json(
        { error: "Invitation code is required" },
        { status: 400 }
      );
    }

    const code = invitationCode.trim().toUpperCase();

    // Look up course by invitation code
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id, title, course_code, semester, description")
      .eq("invitation_code", code)
      .single();

    if (courseError || !course) {
      return NextResponse.json(
        { error: "Invalid invitation code. Please check with your teacher." },
        { status: 404 }
      );
    }

    // Check if already enrolled
    const { data: existing } = await supabase
      .from("course_enrollments")
      .select("id")
      .eq("student_id", user.id)
      .eq("course_id", course.id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "You are already enrolled in this course." },
        { status: 409 }
      );
    }

    // Create enrollment
    const { data: enrollment, error: insertError } = await supabase
      .from("course_enrollments")
      .insert({
        student_id: user.id,
        course_id: course.id,
      })
      .select("id, enrolled_at")
      .single();

    if (insertError) {
      console.error("Enrollment insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to enroll in course" },
        { status: 500 }
      );
    }

    return NextResponse.json({ enrollment, course }, { status: 201 });
  } catch (error) {
    console.error("POST /api/enrollments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
