"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components";
import { createClient } from "@/utils/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSessionReady, setIsSessionReady] = useState(false);

  useEffect(() => {
    // Supabase sends the recovery token in the URL hash.
    // The browser client automatically picks it up and establishes a session.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "PASSWORD_RECOVERY") {
          setIsSessionReady(true);
        }
      }
    );

    // Also check if a session already exists (e.g. page refresh after token exchange)
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setIsSessionReady(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setApiError("");

    if (password.length < 8) {
      setApiError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setApiError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setApiError(error.message);
        setIsLoading(false);
        return;
      }

      await supabase.auth.signOut();
      setIsSubmitted(true);
    } catch (error) {
      console.error("Reset password error:", error);
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
                Password reset successful
              </p>
              <p className="mt-1 text-sm text-green-600">
                Your password has been updated. You can now log in with your new
                password.
              </p>
            </div>

            <Button fullWidth onClick={() => router.push("/login")}>
              Go to Login
            </Button>
          </div>
        ) : !isSessionReady ? (
          /* Waiting for session / invalid link */
          <div className="flex flex-col gap-5">
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
              <p className="text-sm font-medium text-red-800">
                Invalid or expired reset link
              </p>
              <p className="mt-1 text-sm text-red-600">
                Please request a new password reset link.
              </p>
            </div>

            <Link
              href="/forgot-password"
              className="block text-center text-sm text-gray-600 transition-colors hover:text-black"
            >
              Request new reset link
            </Link>
          </div>
        ) : (
          /* Reset Password Form */
          <>
            <p className="mb-6 text-center text-sm text-gray-500">
              Enter your new password below.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* API Error Message */}
              {apiError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {apiError}
                </div>
              )}

              {/* New Password */}
              <Input
                label="New Password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {/* Confirm Password */}
              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              {/* Submit */}
              <Button type="submit" fullWidth isLoading={isLoading}>
                Reset Password
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
