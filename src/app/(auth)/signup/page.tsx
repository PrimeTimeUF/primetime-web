"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthTheme } from "../auth-theme-context";
import { StudentIcon, TeacherIcon } from "@/components/ui/role-icons";

type Role = "student" | "teacher";

interface PasswordStrength {
  level: "weak" | "medium" | "strong";
  width: string;
  text: string;
}

export default function SignUpPage() {
  const router = useRouter();
  const { isDark } = useAuthTheme();
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

  // Theme tokens
  const text = isDark ? "text-white" : "text-black";
  const textMid = isDark ? "text-white/60" : "text-black/50";
  const textDim = isDark ? "text-white/40" : "text-black/35";
  const border = isDark ? "border-white/15" : "border-black/12";
  const borderFull = isDark ? "border-white" : "border-black";
  const cardBg = isDark ? "bg-white/[0.03]" : "bg-black/[0.02]";
  const line = isDark ? "bg-white/40" : "bg-black/25";
  const stroke = isDark ? "#ffffff" : "#000000";

  // Password strength
  const passwordStrength = useMemo<PasswordStrength | null>(() => {
    if (!password) return null;

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) {
      return { level: "weak", width: "33%", text: "WEAK" };
    } else if (strength <= 3) {
      return { level: "medium", width: "66%", text: "MEDIUM" };
    } else {
      return { level: "strong", width: "100%", text: "STRONG" };
    }
  }, [password]);

  const strengthColor =
    passwordStrength?.level === "weak"
      ? "bg-red-500"
      : passwordStrength?.level === "medium"
      ? "bg-amber-500"
      : "bg-green-500";

  const strengthTextColor =
    passwordStrength?.level === "weak"
      ? "text-red-500"
      : passwordStrength?.level === "medium"
      ? "text-amber-500"
      : "text-green-500";

  // Validate email on blur
  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value && !emailRegex.test(value)) {
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

    setFullNameError("");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");
    setTermsError("");
    setApiError("");

    let isValid = true;

    if (!fullName.trim()) {
      setFullNameError("Full name is required");
      isValid = false;
    }

    if (!validateEmail(email)) {
      isValid = false;
    }

    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      isValid = false;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      isValid = false;
    }

    if (!acceptedTerms) {
      setTermsError("You must accept the terms to continue");
      isValid = false;
    }

    if (!isValid) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  const inputClass = `w-full border ${border} bg-transparent ${text} font-mono text-sm px-4 py-3 placeholder:${isDark ? "text-white/20" : "text-black/25"} focus:outline-none focus:border-current transition-colors duration-200`;

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
        <span className={`${textMid} text-[10px] font-mono tracking-wider`}>002</span>
        <div className={`flex-1 h-px ${line}`} />
        <span className={`${textMid} text-[10px] font-mono tracking-[0.3em] uppercase`}>REGISTRATION</span>
        <div className={`w-4 h-px ${line}`} />
      </div>

      {/* Title */}
      <h1 className={`font-mono text-2xl lg:text-3xl font-bold ${text} tracking-wider mb-2 transition-colors duration-500`}>
        CREATE ACCOUNT
      </h1>
      <p className={`font-mono text-xs ${textMid} tracking-wider mb-8 transition-colors duration-500`}>
        Prepare. Prime. Perform.
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* API Error */}
        {apiError && (
          <div className={`border ${isDark ? "border-red-500/40" : "border-red-500/60"} ${isDark ? "bg-red-500/10" : "bg-red-50"} p-3 font-mono text-xs ${isDark ? "text-red-400" : "text-red-600"}`}>
            {apiError}
          </div>
        )}

        {/* Full Name */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="fullName" className={`font-mono text-[10px] ${textDim} tracking-[0.25em] uppercase`}>
            FULL NAME
          </label>
          <input
            id="fullName"
            type="text"
            required
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="John Doe"
            className={inputClass}
          />
          {fullNameError && (
            <p className="font-mono text-[10px] text-red-500 tracking-wider">{fullNameError}</p>
          )}
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className={`font-mono text-[10px] ${textDim} tracking-[0.25em] uppercase`}>
            EMAIL
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => validateEmail(email)}
            placeholder="user@university.edu"
            className={inputClass}
          />
          {emailError && (
            <p className="font-mono text-[10px] text-red-500 tracking-wider">{emailError}</p>
          )}
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className={`font-mono text-[10px] ${textDim} tracking-[0.25em] uppercase`}>
            PASSWORD
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={inputClass}
          />
          {/* Password Strength Indicator */}
          {passwordStrength && (
            <div className="flex items-center gap-3">
              <div className={`flex-1 h-px ${isDark ? "bg-white/10" : "bg-black/10"} overflow-hidden`}>
                <div
                  className={`h-full ${strengthColor} transition-all duration-300`}
                  style={{ width: passwordStrength.width }}
                />
              </div>
              <span className={`font-mono text-[10px] tracking-wider ${strengthTextColor}`}>
                {passwordStrength.text}
              </span>
            </div>
          )}
          <span className={`font-mono text-[10px] ${textDim} tracking-wider`}>
            MINIMUM 8 CHARACTERS
          </span>
          {passwordError && (
            <p className="font-mono text-[10px] text-red-500 tracking-wider">{passwordError}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirmPassword" className={`font-mono text-[10px] ${textDim} tracking-[0.25em] uppercase`}>
            CONFIRM PASSWORD
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              validatePasswordMatch(e.target.value);
            }}
            placeholder="••••••••"
            className={inputClass}
          />
          {confirmPasswordError && (
            <p className="font-mono text-[10px] text-red-500 tracking-wider">{confirmPasswordError}</p>
          )}
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

        {/* Terms of Service */}
        <div className="flex flex-col gap-2">
          <label className="flex cursor-pointer items-start gap-3 group">
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => {
                  setAcceptedTerms(e.target.checked);
                  if (e.target.checked) setTermsError("");
                }}
                className="sr-only peer"
              />
              <div className={`w-4 h-4 border ${acceptedTerms ? borderFull : border} ${acceptedTerms ? (isDark ? "bg-white/10" : "bg-black/5") : "bg-transparent"} transition-all duration-200 flex items-center justify-center`}>
                {acceptedTerms && (
                  <svg viewBox="0 0 12 12" fill="none" className="w-2.5 h-2.5">
                    <path d="M2 6L5 9L10 3" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </div>
            <span className={`flex-1 font-mono text-[11px] leading-relaxed ${textMid} tracking-wider`}>
              I AGREE TO THE{" "}
              <Link
                href="/terms"
                target="_blank"
                className={`${text} underline underline-offset-2 transition-opacity hover:opacity-70`}
              >
                TERMS
              </Link>{" "}
              AND{" "}
              <Link
                href="/privacy"
                target="_blank"
                className={`${text} underline underline-offset-2 transition-opacity hover:opacity-70`}
              >
                PRIVACY POLICY
              </Link>
            </span>
          </label>
          {termsError && (
            <p className="font-mono text-[10px] text-red-500 tracking-wider">{termsError}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className={`relative w-full font-mono text-sm ${text} border ${borderFull} px-6 py-3 ${isDark ? "hover:bg-white hover:text-black" : "hover:bg-black hover:text-white"} transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed tracking-wider`}
        >
          <span className={`absolute -top-1 -left-1 w-2 h-2 border-t border-l ${borderFull} opacity-0 group-hover:opacity-100 transition-opacity`} />
          <span className={`absolute -bottom-1 -right-1 w-2 h-2 border-b border-r ${borderFull} opacity-0 group-hover:opacity-100 transition-opacity`} />
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              CREATING ACCOUNT...
            </span>
          ) : (
            "CREATE ACCOUNT"
          )}
        </button>
      </form>

      {/* Login Footer */}
      <div className="mt-8 pt-8 relative">
        <div className={`absolute top-0 left-0 right-0 h-px ${isDark ? "bg-white/15" : "bg-black/12"}`} />
        <p className={`font-mono text-xs ${textMid} text-center tracking-wider`}>
          ALREADY HAVE AN ACCOUNT?{" "}
          <Link
            href="/login"
            className={`font-semibold ${text} transition-opacity hover:opacity-70`}
          >
            LOG IN
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
  const text = isDark ? "text-white" : "text-black";
  const border = isDark ? "border-white/15" : "border-black/12";
  const borderFull = isDark ? "border-white" : "border-black";
  const selectedBg = isDark ? "bg-white/[0.08]" : "bg-black/[0.05]";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative flex flex-col items-center justify-center gap-2 border ${selected ? borderFull : border} px-4 py-4 ${selected ? selectedBg : "bg-transparent"} transition-all duration-200 group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current`}
    >
      {/* Corner accent when selected */}
      <div className={`absolute top-0 left-0 w-3 h-3 border-t border-l ${borderFull} ${selected ? "opacity-100" : "opacity-0"} transition-opacity`} />
      <div className={`absolute bottom-0 right-0 w-3 h-3 border-b border-r ${borderFull} ${selected ? "opacity-100" : "opacity-0"} transition-opacity`} />

      {icon}
      <span className={`font-mono text-xs ${text} tracking-widest`}>{label}</span>

      {/* Active indicator dot */}
      <div className={`w-1 h-1 rounded-full ${selected ? (isDark ? "bg-white" : "bg-black") : "bg-transparent"} ${selected ? "animate-pulse" : ""} transition-colors duration-200`} />
    </button>
  );
}
