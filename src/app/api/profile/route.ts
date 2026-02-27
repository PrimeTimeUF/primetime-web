import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * GET /api/profile
 * Fetch the current user's profile data
 */
export async function GET() {
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

    // Fetch user profile from users table
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, email, role, full_name, profile_image_url, created_at")
      .eq("id", user.id)
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: "Failed to fetch profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/profile
 * Update the current user's profile data
 */
export async function PATCH(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { full_name, profile_image_url } = body;

    // Validate inputs
    const updates: { full_name?: string; profile_image_url?: string | null } = {};

    if (full_name !== undefined) {
      if (typeof full_name !== "string" || full_name.trim().length === 0) {
        return NextResponse.json(
          { error: "Full name is required" },
          { status: 400 }
        );
      }
      updates.full_name = full_name.trim();
    }

    if (profile_image_url !== undefined) {
      if (typeof profile_image_url !== "string") {
        return NextResponse.json(
          { error: "Invalid profile image URL" },
          { status: 400 }
        );
      }
      updates.profile_image_url = profile_image_url.trim() || null;
    }

    // Check if there are updates to apply
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No updates provided" },
        { status: 400 }
      );
    }

    // Update the user profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from("users")
      .update(updates)
      .eq("id", user.id)
      .select("id, email, role, full_name, profile_image_url, created_at")
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile: updatedProfile });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
