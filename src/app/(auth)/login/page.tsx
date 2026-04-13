"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthTheme } from "../auth-theme-context";
import { StudentIcon, TeacherIcon } from "@/components/ui/role-icons";

type Role = "student" | "teacher";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-[460px] h-[500px]" />}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const { isDark } = useAuthTheme();
  const [role, setRole] = useState<Role>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  // Theme tokens
  const text = isDark ? 'text-white' : 'text-black';
  const textMid = isDark ? 'text-white/60' : 'text-black/50';
  const textDim = isDark ? 'text-white/40' : 'text-black/35';
  const border = isDark ? 'border-white/15' : 'border-black/12';
  const borderFull = isDark ? 'border-white' : 'border-black';
  const cardBg = isDark ? 'bg-white/[0.03]' : 'bg-black/[0.02]';
  const line = isDark ? 'bg-white/40' : 'bg-black/25';
  const stroke = isDark ? '#ffffff' : '#000000';

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setApiError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setApiError(data.error || "Failed to log in");
        setIsLoading(false);
        return;
      }

      if (data.user.role !== role) {
        setApiError(`This account is registered as a ${data.user.role}. Please select the correct role.`);
        setIsLoading(false);
        return;
      }

      if (redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")) {
        router.push(redirectTo);
      } else if (data.user.role === "teacher") {
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
    <div className={`w-full max-w-[460px] relative border ${border} ${cardBg} p-6 lg:p-10 animate-slide-up`}>
      {/* Panel corner accents */}
      <div className={`absolute top-0 left-0 w-4 h-4 border-t border-l ${border} opacity-60`} />
      <div className={`absolute top-0 right-0 w-4 h-4 border-t border-r ${border} opacity-60`} />
      <div className={`absolute bottom-0 left-0 w-4 h-4 border-b border-l ${border} opacity-60`} />
      <div className={`absolute bottom-0 right-0 w-4 h-4 border-b border-r ${border} opacity-60`} />

      {/* Section label */}
      <div className="flex items-center gap-2 mb-6 opacity-60">
        <div className={`w-6 h-px ${line}`} />
        <span className={`${textMid} text-[10px] font-mono tracking-wider`}>001</span>
        <div className={`flex-1 h-px ${line}`} />
        <span className={`${textMid} text-[10px] font-mono tracking-[0.3em] uppercase`}>AUTHENTICATION</span>
        <div className={`w-4 h-px ${line}`} />
      </div>

      {/* Title */}
      <h1 className={`font-mono text-2xl lg:text-3xl font-bold ${text} tracking-wider mb-2 transition-colors duration-500`}>
        SIGN IN
      </h1>
      <p className={`font-mono text-xs ${textMid} tracking-wider mb-8 transition-colors duration-500`}>
        Prepare. Prime. Perform.
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Error */}
        {apiError && (
          <div className={`border ${isDark ? 'border-red-500/40' : 'border-red-500/60'} ${isDark ? 'bg-red-500/10' : 'bg-red-50'} p-3 font-mono text-xs ${isDark ? 'text-red-400' : 'text-red-600'}`}>
            {apiError}
          </div>
        )}

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label className={`font-mono text-[10px] ${textDim} tracking-[0.25em] uppercase`}>
            EMAIL
          </label>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@university.edu"
            className={`w-full border ${border} bg-transparent ${text} font-mono text-sm px-4 py-3 placeholder:${isDark ? 'text-white/20' : 'text-black/25'} focus:outline-none focus:border-current transition-colors duration-200`}
          />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label className={`font-mono text-[10px] ${textDim} tracking-[0.25em] uppercase`}>
            PASSWORD
          </label>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={`w-full border ${border} bg-transparent ${text} font-mono text-sm px-4 py-3 placeholder:${isDark ? 'text-white/20' : 'text-black/25'} focus:outline-none focus:border-current transition-colors duration-200`}
          />
        </div>

        {/* Role Selector */}
        <div className="flex flex-col gap-2">
          <span className={`font-mono text-[10px] ${textDim} tracking-[0.25em] uppercase`}>
            I AM A...
          </span>
          <div className="grid grid-cols-2 gap-3">
            <RoleOption
              role="student"
              icon={<StudentIcon stroke={stroke} />}
              label="STUDENT"
              selected={role === "student"}
              onSelect={() => setRole("student")}
              isDark={isDark}
            />
            <RoleOption
              role="teacher"
              icon={<TeacherIcon stroke={stroke} />}
              label="TEACHER"
              selected={role === "teacher"}
              onSelect={() => setRole("teacher")}
              isDark={isDark}
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className={`relative w-full font-mono text-sm ${text} border ${borderFull} px-6 py-3 ${isDark ? 'hover:bg-white hover:text-black' : 'hover:bg-black hover:text-white'} transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed tracking-wider`}
        >
          <span className={`absolute -top-1 -left-1 w-2 h-2 border-t border-l ${borderFull} opacity-0 group-hover:opacity-100 transition-opacity`} />
          <span className={`absolute -bottom-1 -right-1 w-2 h-2 border-b border-r ${borderFull} opacity-0 group-hover:opacity-100 transition-opacity`} />
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              AUTHENTICATING...
            </span>
          ) : (
            "LOG IN"
          )}
        </button>

        {/* Forgot Password */}
        <Link
          href="/forgot-password"
          className={`block text-center font-mono text-xs ${textMid} hover:${isDark ? 'text-white' : 'text-black'} transition-colors tracking-wider`}
        >
          FORGOT PASSWORD?
        </Link>
      </form>

      {/* Sign Up Footer */}
      <div className="mt-8 pt-8 relative">
        <div className={`absolute top-0 left-0 right-0 h-px ${isDark ? 'bg-white/15' : 'bg-black/12'}`} />
        <p className={`font-mono text-xs ${textMid} text-center tracking-wider`}>
          NO ACCOUNT?{" "}
          <Link
            href="/signup"
            className={`font-semibold ${text} transition-opacity hover:opacity-70`}
          >
            REGISTER
          </Link>
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Role Option                                                        */
/* ------------------------------------------------------------------ */

interface RoleOptionProps {
  role: Role;
  icon: React.ReactNode;
  label: string;
  selected: boolean;
  onSelect: () => void;
  isDark: boolean;
}

function RoleOption({ icon, label, selected, onSelect, isDark }: Readonly<RoleOptionProps>) {
  const text = isDark ? 'text-white' : 'text-black';
  const border = isDark ? 'border-white/15' : 'border-black/12';
  const borderFull = isDark ? 'border-white' : 'border-black';
  const selectedBg = isDark ? 'bg-white/[0.08]' : 'bg-black/[0.05]';

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative flex flex-col items-center justify-center gap-2 border ${selected ? borderFull : border} px-4 py-4 ${selected ? selectedBg : 'bg-transparent'} transition-all duration-200 group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current`}
    >
      {/* Corner accent when selected */}
      <div className={`absolute top-0 left-0 w-3 h-3 border-t border-l ${borderFull} ${selected ? 'opacity-100' : 'opacity-0'} transition-opacity`} />
      <div className={`absolute bottom-0 right-0 w-3 h-3 border-b border-r ${borderFull} ${selected ? 'opacity-100' : 'opacity-0'} transition-opacity`} />

      {icon}
      <span className={`font-mono text-xs ${text} tracking-widest`}>{label}</span>

      {/* Active indicator dot */}
      <div className={`w-1 h-1 rounded-full ${selected ? (isDark ? 'bg-white' : 'bg-black') : 'bg-transparent'} ${selected ? 'animate-pulse' : ''} transition-colors duration-200`} />
    </button>
  );
}
