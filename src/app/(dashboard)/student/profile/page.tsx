"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDashboardTheme } from "../../teacher/dashboard-theme-context";
import { SectionLabel, BrutalistCard, BrutalistButton, BrutalistInput, themeTokens } from "@/components/ui/dashboard-primitives";

interface ProfileData {
  id: string;
  email: string;
  role: string;
  full_name: string;
  profile_image_url: string | null;
  created_at: string;
}

export default function StudentProfilePage() {
  const router = useRouter();
  const { isDark } = useDashboardTheme();
  const t = themeTokens(isDark);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [fullName, setFullName] = useState("");
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/profile");

        if (res.status === 401) {
          router.push("/login");
          return;
        }

        if (!res.ok) throw new Error("Failed to fetch profile");

        const data = await res.json();
        setProfile(data.profile);
        setFullName(data.profile.full_name);
        setProfileImagePreview(data.profile.profile_image_url);
      } catch (err) {
        console.error("Profile fetch error:", err);
        setError("Failed to load profile data");
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, [router]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Invalid file type. Only JPEG, PNG, and WebP are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit");
      return;
    }

    setError("");
    setSuccess("");
    setIsUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/profile/upload-image", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to upload image");
      }

      const data = await res.json();
      setProfileImagePreview(data.url);
      setSuccess("Profile image updated successfully!");

      const profileRes = await fetch("/api/profile");
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData.profile);
      }
    } catch (err) {
      console.error("Image upload error:", err);
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSaveProfile = async () => {
    setError("");
    setSuccess("");

    if (!fullName.trim()) {
      setError("Full name is required");
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update profile");
      }

      const data = await res.json();
      setProfile(data.profile);
      setSuccess("Profile updated successfully!");
    } catch (err) {
      console.error("Profile update error:", err);
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All password fields are required");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    setIsChangingPassword(true);

    try {
      const res = await fetch("/api/profile/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to change password");
      }

      setPasswordSuccess("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Password change error:", err);
      setPasswordError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className={`font-mono text-sm ${t.textMid}`}>LOADING...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className={`font-mono text-sm ${t.textMid}`}>ERROR LOADING PROFILE</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[800px]">
      {/* Back link */}
      <button
        onClick={() => router.push("/student")}
        className={`mb-6 inline-flex items-center gap-2 font-mono text-xs tracking-wider ${t.textMid} transition-colors ${isDark ? 'hover:text-white' : 'hover:text-black'}`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        BACK TO DASHBOARD
      </button>

      <SectionLabel num="002" label="PROFILE & SETTINGS" isDark={isDark} />

      {/* Profile Section */}
      <BrutalistCard isDark={isDark} className="mb-6">
        <h2 className={`font-mono text-xs tracking-[0.3em] uppercase ${t.textMid} mb-6`}>PROFILE INFORMATION</h2>

        {/* Profile Picture */}
        <div className="mb-6">
          <label className={`block font-mono text-[10px] ${t.textDim} tracking-[0.25em] uppercase mb-3`}>
            PROFILE PICTURE
          </label>
          <div className="flex items-center gap-4">
            <div className={`w-20 h-20 border ${t.borderDim} ${t.text} flex items-center justify-center font-mono text-2xl font-bold overflow-hidden`}>
              {profileImagePreview ? (
                <img src={profileImagePreview} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                getInitials(fullName)
              )}
            </div>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageSelect}
                className="hidden"
              />
              <BrutalistButton
                isDark={isDark}
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
                isLoading={isUploadingImage}
              >
                {isUploadingImage ? "UPLOADING..." : "CHANGE PHOTO"}
              </BrutalistButton>
            </div>
          </div>
          <p className={`mt-2 font-mono text-[10px] ${t.textDim} tracking-wider`}>
            JPG, PNG or WebP. Max size 5MB.
          </p>
        </div>

        {/* Full Name */}
        <div className="mb-6">
          <BrutalistInput
            isDark={isDark}
            label="FULL NAME"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your full name"
          />
        </div>

        {/* Email (read-only) */}
        <div className="mb-6">
          <BrutalistInput
            isDark={isDark}
            label="EMAIL"
            type="email"
            value={profile.email}
            disabled
          />
          <p className={`mt-1 font-mono text-[10px] ${t.textDim} tracking-wider`}>
            Email cannot be changed
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className={`mb-4 p-3 border font-mono text-xs ${isDark ? 'border-red-500/40 text-red-400' : 'border-red-500/60 text-red-600'}`}>
            {error}
          </div>
        )}
        {success && (
          <div className={`mb-4 p-3 border font-mono text-xs ${isDark ? 'border-green-500/40 text-green-400' : 'border-green-500/60 text-green-600'}`}>
            {success}
          </div>
        )}

        <div className="flex justify-end">
          <BrutalistButton
            isDark={isDark}
            onClick={handleSaveProfile}
            isLoading={isSaving}
            disabled={isSaving}
          >
            SAVE CHANGES
          </BrutalistButton>
        </div>
      </BrutalistCard>

      {/* Password Section */}
      <BrutalistCard isDark={isDark} className="mb-6">
        <h2 className={`font-mono text-xs tracking-[0.3em] uppercase ${t.textMid} mb-6`}>CHANGE PASSWORD</h2>

        <div className="space-y-4 mb-6">
          <BrutalistInput
            isDark={isDark}
            label="CURRENT PASSWORD"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter current password"
          />
          <BrutalistInput
            isDark={isDark}
            label="NEW PASSWORD"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password (min 6 characters)"
          />
          <BrutalistInput
            isDark={isDark}
            label="CONFIRM NEW PASSWORD"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
          />
        </div>

        {passwordError && (
          <div className={`mb-4 p-3 border font-mono text-xs ${isDark ? 'border-red-500/40 text-red-400' : 'border-red-500/60 text-red-600'}`}>
            {passwordError}
          </div>
        )}
        {passwordSuccess && (
          <div className={`mb-4 p-3 border font-mono text-xs ${isDark ? 'border-green-500/40 text-green-400' : 'border-green-500/60 text-green-600'}`}>
            {passwordSuccess}
          </div>
        )}

        <div className="flex justify-end">
          <BrutalistButton
            isDark={isDark}
            onClick={handleChangePassword}
            isLoading={isChangingPassword}
            disabled={isChangingPassword}
          >
            CHANGE PASSWORD
          </BrutalistButton>
        </div>
      </BrutalistCard>

      {/* Account Info */}
      <BrutalistCard isDark={isDark}>
        <h2 className={`font-mono text-xs tracking-[0.3em] uppercase ${t.textMid} mb-6`}>ACCOUNT INFORMATION</h2>

        <div className="space-y-4">
          <div className={`flex justify-between py-3 border-b ${isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'}`}>
            <span className={`font-mono text-xs ${t.textDim} tracking-wider`}>ACCOUNT TYPE</span>
            <span className={`font-mono text-xs font-bold ${t.text} tracking-wider uppercase`}>{profile.role}</span>
          </div>
          <div className="flex justify-between py-3">
            <span className={`font-mono text-xs ${t.textDim} tracking-wider`}>MEMBER SINCE</span>
            <span className={`font-mono text-xs font-bold ${t.text} tracking-wider`}>{formatDate(profile.created_at)}</span>
          </div>
        </div>
      </BrutalistCard>
    </div>
  );
}
