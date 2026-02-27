import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * POST /api/profile/upload-image
 * Upload a profile image for the current user
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse the form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, and WebP are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 5MB limit" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/profile.${fileExt}`;

    // Delete old profile image if it exists
    const { data: existingFiles } = await supabase
      .storage
      .from("profile-images")
      .list(user.id);

    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map(f => `${user.id}/${f.name}`);
      await supabase.storage.from("profile-images").remove(filesToDelete);
    }

    // Upload new file to storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from("profile-images")
      .upload(fileName, file, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload image" },
        { status: 500 }
      );
    }

    // Get public URL for the uploaded image
    const { data: { publicUrl } } = supabase
      .storage
      .from("profile-images")
      .getPublicUrl(fileName);

    // Update user profile with new image URL
    const { error: updateError } = await supabase
      .from("users")
      .update({ profile_image_url: publicUrl })
      .eq("id", user.id);

    if (updateError) {
      console.error("Profile update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: publicUrl,
      message: "Profile image uploaded successfully",
    });
  } catch (error) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
