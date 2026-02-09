"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components";

type Role = "student" | "teacher";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setApiError("");

    try {
      // Call login API
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setApiError(data.error || "Failed to log in");
        setIsLoading(false);
        return;
      }

      // Check if the user's role matches the selected role
      if (data.user.role !== role) {
        setApiError(`This account is registered as a ${data.user.role}. Please select the correct role.`);
        setIsLoading(false);
        return;
      }

      // Redirect to appropriate dashboard based on role
      if (data.user.role === "teacher") {
        router.push("/teacher");
      } else {
        router.push("/student");
      }
    } catch (error) {
      console.error("Login error:", error);
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
          <p className="mt-2 text-sm text-gray-500">
            Prepare. Prime. Perform.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* API Error Message */}
          {apiError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {apiError}
            </div>
          )}

          {/* Email */}
          <Input
            label="Email"
            type="email"
            placeholder="student@university.edu"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* Password */}
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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

          {/* Remember Me */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 accent-black"
            />
            <span className="text-sm text-gray-600">Remember me</span>
          </label>

          {/* Submit */}
          <Button type="submit" fullWidth isLoading={isLoading}>
            Log In
          </Button>

          {/* Forgot Password */}
          <Link
            href="/forgot-password"
            className="block text-center text-sm text-gray-600 transition-colors hover:text-black"
          >
            Forgot password?
          </Link>
        </form>

        {/* Sign Up Footer */}
        <div className="mt-8 border-t border-gray-100 pt-8 text-center">
          <p className="text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-semibold text-black transition-opacity hover:opacity-70"
            >
              Sign up
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

function RoleOption({ icon, label, selected, onSelect }: Readonly<RoleOptionProps>) {
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
