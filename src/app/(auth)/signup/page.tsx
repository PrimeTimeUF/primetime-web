"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components";

type Role = "student" | "teacher";

interface PasswordStrength {
  level: "weak" | "medium" | "strong";
  width: string;
  text: string;
  color: string;
}

export default function SignUpPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("student");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Validation errors
  const [fullNameError, setFullNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [termsError, setTermsError] = useState("");
  const [apiError, setApiError] = useState("");

  // Password strength
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);

  // Calculate password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength(null);
      return;
    }

    let strength = 0;

    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) {
      setPasswordStrength({
        level: "weak",
        width: "33%",
        text: "Weak password",
        color: "bg-red-500",
      });
    } else if (strength <= 3) {
      setPasswordStrength({
        level: "medium",
        width: "66%",
        text: "Medium strength",
        color: "bg-amber-500",
      });
    } else {
      setPasswordStrength({
        level: "strong",
        width: "100%",
        text: "Strong password",
        color: "bg-green-500",
      });
    }
  }, [password]);

  // Validate email on blur
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  // Validate password match
  const validatePasswordMatch = (confirm: string) => {
    if (confirm && confirm !== password) {
      setConfirmPasswordError("Passwords do not match");
      return false;
    }
    setConfirmPasswordError("");
    return true;
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Reset errors
    setFullNameError("");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");
    setTermsError("");
    setApiError("");

    let isValid = true;

    // Validate full name
    if (!fullName.trim()) {
      setFullNameError("Full name is required");
      isValid = false;
    }

    // Validate email
    if (!validateEmail(email)) {
      isValid = false;
    }

    // Validate password length
    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
      isValid = false;
    }

    // Validate password match
    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      isValid = false;
    }

    // Validate terms acceptance
    if (!acceptedTerms) {
      setTermsError("You must accept the terms to continue");
      isValid = false;
    }

    if (!isValid) {
      return;
    }

    setIsLoading(true);

    try {
      // Call signup API
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          role,
          fullName: fullName.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setApiError(data.error || "Failed to create account");
        setIsLoading(false);
        return;
      }

      // Redirect to appropriate dashboard based on role
      if (role === "teacher") {
        router.push("/teacher");
      } else {
        router.push("/student");
      }
    } catch (error) {
      console.error("Signup error:", error);
      setApiError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-[420px] animate-slide-up rounded-2xl bg-white p-10 shadow-lg">
        {/* Brand Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-black">
            PrimeTime
          </h1>
          <p className="mt-2 text-sm text-gray-500">Create your account</p>
        </div>

        {/* Sign Up Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* API Error Message */}
          {apiError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {apiError}
            </div>
          )}

          {/* Full Name */}
          <Input
            label="Full Name"
            type="text"
            placeholder="John Doe"
            required
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            error={fullNameError}
          />

          {/* Email */}
          <Input
            label="Email"
            type="email"
            placeholder="student@university.edu"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => validateEmail(email)}
            error={emailError}
          />

          {/* Password */}
          <div className="flex flex-col gap-2">
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={passwordError}
            />

            {/* Password Strength Indicator */}
            {passwordStrength && (
              <div className="-mt-1">
                <div className="h-[3px] overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full transition-all duration-200 ${passwordStrength.color}`}
                    style={{ width: passwordStrength.width }}
                  />
                </div>
                <p
                  className="mt-1 text-xs"
                  style={{
                    color:
                      passwordStrength.level === "weak"
                        ? "#EF4444"
                        : passwordStrength.level === "medium"
                        ? "#F59E0B"
                        : "#22C55E",
                  }}
                >
                  {passwordStrength.text}
                </p>
              </div>
            )}

            <span className="text-xs text-gray-500">Minimum 8 characters</span>
          </div>

          {/* Confirm Password */}
          <Input
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              validatePasswordMatch(e.target.value);
            }}
            error={confirmPasswordError}
          />

          {/* Role Selector */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-black">I am a...</span>
            <div className="grid grid-cols-2 gap-3">
              <RoleOption
                role="student"
                icon="📚"
                label="Student"
                selected={role === "student"}
                onSelect={() => setRole("student")}
              />
              <RoleOption
                role="teacher"
                icon="👨‍🏫"
                label="Teacher"
                selected={role === "teacher"}
                onSelect={() => setRole("teacher")}
              />
            </div>
          </div>

          {/* Terms of Service Checkbox */}
          <div className="flex flex-col gap-2">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => {
                  setAcceptedTerms(e.target.checked);
                  if (e.target.checked) {
                    setTermsError("");
                  }
                }}
                className="mt-0.5 h-[18px] w-[18px] rounded border-2 border-gray-300 accent-black"
              />
              <span className="flex-1 text-sm leading-normal text-gray-700">
                I agree to the{" "}
                <Link
                  href="/terms"
                  target="_blank"
                  className="text-black underline underline-offset-2 transition-opacity hover:opacity-70"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  target="_blank"
                  className="text-black underline underline-offset-2 transition-opacity hover:opacity-70"
                >
                  Privacy Policy
                </Link>
              </span>
            </label>
            {termsError && (
              <p className="text-xs text-red-500">{termsError}</p>
            )}
          </div>

          {/* Submit Button */}
          <Button type="submit" fullWidth isLoading={isLoading}>
            Create Account
          </Button>
        </form>

        {/* Login Link */}
        <div className="mt-8 border-t border-gray-100 pt-8 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-black transition-opacity hover:opacity-70"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Role Option Button                                                 */
/* ------------------------------------------------------------------ */

interface RoleOptionProps {
  role: Role;
  icon: string;
  label: string;
  selected: boolean;
  onSelect: () => void;
}

function RoleOption({
  icon,
  label,
  selected,
  onSelect,
}: Readonly<RoleOptionProps>) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 px-5 py-5 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black ${
        selected
          ? "border-black bg-black text-white"
          : "border-gray-200 bg-white text-black hover:border-gray-400 hover:bg-gray-50"
      }`}
    >
      <span className="text-2xl leading-none">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
