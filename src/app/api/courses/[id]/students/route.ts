import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// GET /api/courses/[id]/students - List enrolled students for a course (teacher only)
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

    // Verify teacher owns this course
    const { data: course } = await supabase
      .from("courses")
      .select("id, teacher_id")
      .eq("id", courseId)
      .eq("teacher_id", user.id)
      .single();

    if (!course) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch enrollments
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from("course_enrollments")
      .select("id, student_id, enrolled_at")
      .eq("course_id", courseId)
      .order("enrolled_at", { ascending: false });

    if (enrollmentsError) {
      console.error("Enrollments fetch error:", enrollmentsError);
      return NextResponse.json(
        { error: "Failed to fetch students" },
        { status: 500 }
      );
    }

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({ students: [], count: 0 }, { status: 200 });
    }

    // Fetch student details from public.users
    const studentIds = enrollments.map((e) => e.student_id);
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, full_name, email")
      .in("id", studentIds);

    if (usersError) {
      console.error("Users fetch error:", usersError);
      return NextResponse.json(
        { error: "Failed to fetch student details" },
        { status: 500 }
      );
    }

    const usersMap = new Map(
      (users ?? []).map((u) => [u.id, u])
    );

    const students = enrollments.map((e) => {
      const userInfo = usersMap.get(e.student_id);
      return {
        id: e.student_id,
        full_name: userInfo?.full_name ?? "Unknown",
        email: userInfo?.email ?? "",
        enrolled_at: e.enrolled_at,
      };
    });

    return NextResponse.json(
      { students, count: students.length },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/courses/[id]/students error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
