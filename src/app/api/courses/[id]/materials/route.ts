import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// GET /api/courses/[id]/materials - Fetch all materials for a course
export async function GET(
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

    // Check if user has access to this course (teacher or enrolled student)
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify access based on role
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

    // Fetch materials
    const { data: materials, error: materialsError } = await supabase
      .from("course_materials")
      .select("*")
      .eq("course_id", courseId)
      .order("uploaded_at", { ascending: false });

    if (materialsError) {
      console.error("Materials fetch error:", materialsError);
      return NextResponse.json(
        { error: "Failed to fetch materials" },
        { status: 500 }
      );
    }

    return NextResponse.json({ materials }, { status: 200 });
  } catch (error) {
    console.error("GET /api/courses/[id]/materials error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/courses/[id]/materials - Upload a new material
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: courseId } = await params;

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is the course teacher
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("teacher_id")
      .eq("id", courseId)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (course.teacher_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const lectureName = formData.get("lectureName") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size (25MB = 26214400 bytes)
    const MAX_FILE_SIZE = 26214400;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 25MB limit" },
        { status: 400 }
      );
    }

    // Generate unique file path with timestamp to avoid collisions
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `${courseId}/${timestamp}-${sanitizedFileName}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from("course-materials")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Upload failed", details: uploadError.message },
        { status: 500 }
      );
    }

    // Get public URL (will require authentication to access)
    const {
      data: { publicUrl },
    } = supabase.storage.from("course-materials").getPublicUrl(filePath);

    // Save metadata to database
    const { data: material, error: dbError } = await supabase
      .from("course_materials")
      .insert({
        course_id: courseId,
        file_name: file.name,
        file_url: filePath, // Store the path, not the public URL
        file_size: file.size,
        file_type: file.type,
        lecture_name: lectureName || null,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      // Rollback: delete uploaded file
      await supabase.storage.from("course-materials").remove([filePath]);
      return NextResponse.json(
        { error: "Database error", details: dbError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ material }, { status: 201 });
  } catch (error) {
    console.error("POST /api/courses/[id]/materials error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/courses/[id]/materials - Delete a material
export async function DELETE(
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

    // Get material ID from query params
    const url = new URL(request.url);
    const materialId = url.searchParams.get("materialId");

    if (!materialId) {
      return NextResponse.json(
        { error: "Material ID required" },
        { status: 400 }
      );
    }

    // Fetch material to get file path and verify ownership
    const { data: material, error: materialError } = await supabase
      .from("course_materials")
      .select("file_url, course_id")
      .eq("id", materialId)
      .single();

    if (materialError || !material) {
      return NextResponse.json(
        { error: "Material not found" },
        { status: 404 }
      );
    }

    // Verify user is the course teacher
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("teacher_id")
      .eq("id", material.course_id)
      .single();

    if (courseError || !course || course.teacher_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from("course-materials")
      .remove([material.file_url]);

    if (storageError) {
      console.error("Storage delete error:", storageError);
      return NextResponse.json(
        { error: "Failed to delete file from storage" },
        { status: 500 }
      );
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from("course_materials")
      .delete()
      .eq("id", materialId);

    if (dbError) {
      console.error("Database delete error:", dbError);
      return NextResponse.json(
        { error: "Failed to delete from database" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Material deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/courses/[id]/materials error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
