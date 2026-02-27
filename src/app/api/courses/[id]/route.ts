import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    if (profileError || !profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (profile.role === "teacher") {
      const { data: course, error: courseError } = await supabase
        .from("courses")
        .select("*")
        .eq("id", id)
        .single();

      if (courseError || !course) {
        return NextResponse.json({ error: "Course not found" }, { status: 404 });
      }

      if (course.teacher_id !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      return NextResponse.json({ course }, { status: 200 });
    } else if (profile.role === "student") {
      // Verify enrollment
      const { data: enrollment } = await supabase
        .from("course_enrollments")
        .select("id")
        .eq("course_id", id)
        .eq("student_id", user.id)
        .single();

      if (!enrollment) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Fetch course
      const { data: course, error: courseError } = await supabase
        .from("courses")
        .select("id, title, description, course_code, semester, teacher_id")
        .eq("id", id)
        .single();

      if (courseError || !course) {
        return NextResponse.json({ error: "Course not found" }, { status: 404 });
      }

      // Fetch teacher name separately (courses.teacher_id -> auth.users, not public.users)
      const { data: teacher } = await supabase
        .from("users")
        .select("full_name")
        .eq("id", course.teacher_id)
        .single();

      return NextResponse.json(
        {
          course: {
            id: course.id,
            title: course.title,
            description: course.description,
            course_code: course.course_code,
            semester: course.semester,
            teacher_name: teacher?.full_name ?? "Unknown",
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch (error) {
    console.error("GET /api/courses/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
