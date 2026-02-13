import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

const INVITATION_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateInvitationCode(length = 8): string {
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values, (v) => INVITATION_CHARSET[v % INVITATION_CHARSET.length]).join("");
}

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

    if (profileError || profile.role !== "teacher") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: courses, error: coursesError } = await supabase
      .from("courses")
      .select("*")
      .eq("teacher_id", user.id)
      .order("created_at", { ascending: false });

    if (coursesError) {
      console.error("Courses fetch error:", coursesError);
      return NextResponse.json(
        { error: "Failed to fetch courses" },
        { status: 500 }
      );
    }

    return NextResponse.json({ courses }, { status: 200 });
  } catch (error) {
    console.error("GET /api/courses error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, courseCode, semester } = body;

    if (!title || !courseCode || !semester) {
      return NextResponse.json(
        { error: "Title, course code, and semester are required" },
        { status: 400 }
      );
    }

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

    if (profileError || profile.role !== "teacher") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const invitationCode = generateInvitationCode();

    const { data: course, error: insertError } = await supabase
      .from("courses")
      .insert({
        title,
        description: description || null,
        course_code: courseCode,
        semester,
        invitation_code: invitationCode,
        teacher_id: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Course insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create course" },
        { status: 500 }
      );
    }

    return NextResponse.json({ course }, { status: 201 });
  } catch (error) {
    console.error("POST /api/courses error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
