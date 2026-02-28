import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// GET /api/courses/[id]/assignments - List assignments for a course
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

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (profile.role === "teacher") {
      // Verify teacher owns this course
      const { data: course } = await supabase
        .from("courses")
        .select("id")
        .eq("id", courseId)
        .eq("teacher_id", user.id)
        .single();

      if (!course) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Return all assignments (including unpublished) with session data
      const { data: assignments, error: assignmentsError } = await supabase
        .from("session_assignments")
        .select(
          "id, session_id, course_id, assigned_by, due_date, assigned_at, is_published, session:priming_sessions(id, title, lecture_name, duration, status)"
        )
        .eq("course_id", courseId)
        .order("due_date", { ascending: true });

      if (assignmentsError) {
        console.error("Assignments fetch error:", assignmentsError);
        return NextResponse.json(
          { error: "Failed to fetch assignments" },
          { status: 500 }
        );
      }

      return NextResponse.json({ assignments }, { status: 200 });
    } else if (profile.role === "student") {
      // Verify student is enrolled
      const { data: enrollment } = await supabase
        .from("course_enrollments")
        .select("id")
        .eq("course_id", courseId)
        .eq("student_id", user.id)
        .single();

      if (!enrollment) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Return published assignments with session data
      const { data: assignments, error: assignmentsError } = await supabase
        .from("session_assignments")
        .select(
          "id, session_id, course_id, assigned_by, due_date, assigned_at, is_published, session:priming_sessions(id, title, lecture_name, duration, status)"
        )
        .eq("course_id", courseId)
        .eq("is_published", true)
        .order("due_date", { ascending: true });

      if (assignmentsError) {
        console.error("Assignments fetch error:", assignmentsError);
        return NextResponse.json(
          { error: "Failed to fetch assignments" },
          { status: 500 }
        );
      }

      // Fetch student's completion data for these sessions
      const sessionIds = (assignments ?? []).map(
        (a: { session_id: string }) => a.session_id
      );

      let completions: Record<
        string,
        { score: number; total_questions: number; completed_at: string }
      > = {};

      if (sessionIds.length > 0) {
        const { data: results } = await supabase
          .from("student_session_results")
          .select("session_id, score, total_questions, completed_at")
          .eq("student_id", user.id)
          .eq("course_id", courseId)
          .in("session_id", sessionIds);

        if (results) {
          completions = results.reduce(
            (
              acc: Record<
                string,
                {
                  score: number;
                  total_questions: number;
                  completed_at: string;
                }
              >,
              r
            ) => {
              acc[r.session_id] = {
                score: r.score,
                total_questions: r.total_questions,
                completed_at: r.completed_at,
              };
              return acc;
            },
            {}
          );
        }
      }

      // Merge completions into assignments
      const assignmentsWithCompletion = (assignments ?? []).map(
        (a: { session_id: string }) => ({
          ...a,
          completion: completions[a.session_id] ?? null,
        })
      );

      // Calculate progress stats
      const totalAssigned = assignmentsWithCompletion.length;
      const completedCount = assignmentsWithCompletion.filter(
        (a: { completion: unknown }) => a.completion !== null
      ).length;
      const completionPercentage =
        totalAssigned > 0 ? Math.round((completedCount / totalAssigned) * 100) : 0;

      const completedResults = assignmentsWithCompletion
        .filter(
          (a: {
            completion: {
              score: number;
              total_questions: number;
            } | null;
          }) => a.completion !== null
        )
        .map(
          (a: {
            completion: {
              score: number;
              total_questions: number;
            };
          }) => (a.completion.score / a.completion.total_questions) * 100
        );

      const averageScore =
        completedResults.length > 0
          ? Math.round(
              completedResults.reduce(
                (sum: number, p: number) => sum + p,
                0
              ) / completedResults.length
            )
          : 0;

      return NextResponse.json(
        {
          assignments: assignmentsWithCompletion,
          progress: {
            total_assigned: totalAssigned,
            completed_count: completedCount,
            completion_percentage: completionPercentage,
            average_score: averageScore,
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch (error) {
    console.error("GET /api/courses/[id]/assignments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/courses/[id]/assignments - Create a new assignment
export async function POST(
  request: Request,
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

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "teacher") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify teacher owns this course
    const { data: course } = await supabase
      .from("courses")
      .select("id")
      .eq("id", courseId)
      .eq("teacher_id", user.id)
      .single();

    if (!course) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { session_id, due_date } = body;

    if (!session_id || !due_date) {
      return NextResponse.json(
        { error: "session_id and due_date are required" },
        { status: 400 }
      );
    }

    // Validate session exists, is completed, and belongs to course
    const { data: session } = await supabase
      .from("priming_sessions")
      .select("id, status, course_id")
      .eq("id", session_id)
      .single();

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    if (session.course_id !== courseId) {
      return NextResponse.json(
        { error: "Session does not belong to this course" },
        { status: 400 }
      );
    }

    if (session.status !== "completed") {
      return NextResponse.json(
        { error: "Only completed sessions can be assigned" },
        { status: 400 }
      );
    }

    // Check if already assigned
    const { data: existing } = await supabase
      .from("session_assignments")
      .select("id")
      .eq("session_id", session_id)
      .eq("course_id", courseId)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "This session is already assigned" },
        { status: 409 }
      );
    }

    // Create assignment
    const { data: assignment, error: insertError } = await supabase
      .from("session_assignments")
      .insert({
        session_id,
        course_id: courseId,
        assigned_by: user.id,
        due_date,
        is_published: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert assignment error:", insertError);
      return NextResponse.json(
        { error: "Failed to create assignment" },
        { status: 500 }
      );
    }

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error) {
    console.error("POST /api/courses/[id]/assignments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
