"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Input } from "@/components";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setApiError("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setApiError(data.error || "Failed to send reset email");
        setIsLoading(false);
        return;
      }

      setIsSubmitted(true);
    } catch (error) {
      console.error("Forgot password error:", error);
      setApiError("An unexpected error occurred. Please try again.");
    } finally {
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

        {isSubmitted ? (
          /* Success State */
          <div className="flex flex-col gap-5">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
              <p className="text-sm font-medium text-green-800">
                Check your email
              </p>
              <p className="mt-1 text-sm text-green-600">
                We&apos;ve sent a password reset link to{" "}
                <span className="font-medium">{email}</span>
              </p>
            </div>

            <Link
              href="/login"
              className="block text-center text-sm text-gray-600 transition-colors hover:text-black"
            >
              Back to login
            </Link>
          </div>
        ) : (
          /* Forgot Password Form */
          <>
            <p className="mb-6 text-center text-sm text-gray-500">
              Enter your email address and we&apos;ll send you a link to reset
              your password.
            </p>

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

              {/* Submit */}
              <Button type="submit" fullWidth isLoading={isLoading}>
                Send Reset Link
              </Button>

              {/* Back to Login */}
              <Link
                href="/login"
                className="block text-center text-sm text-gray-600 transition-colors hover:text-black"
              >
                Back to login
              </Link>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
