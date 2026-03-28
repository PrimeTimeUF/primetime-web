"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { usePathname, useRouter } from "next/navigation";
import { DashboardThemeContext } from "../teacher/dashboard-theme-context";
import { SunIcon, MoonIcon } from "@/components/ui/auth-primitives";
import { GridBackground, DashboardFooter, themeTokens } from "@/components/ui/dashboard-primitives";

interface StudentLayoutProps {
  children: React.ReactNode;
}

export default function StudentLayout({ children }: Readonly<StudentLayoutProps>) {
  const [isDark, setIsDark] = useState(true);
  const t = themeTokens(isDark);

  return (
    <DashboardThemeContext.Provider value={{ isDark, toggle: () => setIsDark((v) => !v) }}>
      <div className={`relative min-h-screen transition-colors duration-500 ${t.bg}`}>
        <GridBackground isDark={isDark} />
        <StudentDashboardHeader isDark={isDark} onToggle={() => setIsDark((v) => !v)} />
        <main className="relative z-10 mx-auto max-w-[1200px] px-6 py-8 pb-16 pt-24">
          {children}
        </main>
        <DashboardFooter isDark={isDark} />
      </div>
    </DashboardThemeContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  Dashboard Header                                                   */
/* ------------------------------------------------------------------ */

interface DashboardHeaderProps {
  isDark: boolean;
  onToggle: () => void;
}

function StudentDashboardHeader({ isDark, onToggle }: Readonly<DashboardHeaderProps>) {
  const t = themeTokens(isDark);

  return (
    <header className={`sticky top-0 z-50 border-b ${t.border} ${isDark ? 'bg-black/80' : 'bg-white/80'} backdrop-blur-sm transition-colors duration-500`}>
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-6 lg:gap-8">
          <Link
            href="/student"
            className={`font-mono ${t.text} text-xl lg:text-2xl font-bold tracking-widest italic transform -skew-x-12 transition-colors duration-500`}
          >
            PRIMETIME
          </Link>
          <div className={`h-4 w-px ${t.divider} hidden lg:block`} />
          <StudentSidebarNav isDark={isDark} />
        </div>

        {/* Right: Theme toggle + User Menu */}
        <div className="flex items-center gap-3 lg:gap-5">
          <button
            onClick={onToggle}
            className={`flex items-center justify-center w-8 h-8 border ${t.borderDim} ${t.text} transition-all duration-200 font-mono`}
            aria-label="Toggle light/dark mode"
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>
          <StudentUserMenu isDark={isDark} />
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/*  Sidebar Nav                                                        */
/* ------------------------------------------------------------------ */

const NAV_ITEMS = [
  { label: "COURSES", href: "/student" },
  { label: "PERFORMANCE", href: "/student/performance" },
] as const;

function StudentSidebarNav({ isDark }: Readonly<{ isDark: boolean }>) {
  const pathname = usePathname();
  const t = themeTokens(isDark);

  return (
    <nav className="flex items-center gap-1">
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/student"
            ? pathname === "/student"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative font-mono text-xs tracking-[0.2em] px-3 py-2 transition-colors duration-200 ${
              isActive ? t.text : `${t.textMid} ${isDark ? 'hover:text-white' : 'hover:text-black'}`
            }`}
          >
            {item.label}
            {isActive && (
              <div className={`absolute bottom-0 left-1 right-1 h-px ${isDark ? 'bg-white' : 'bg-black'}`} />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/*  User Menu                                                          */
/* ------------------------------------------------------------------ */

function StudentUserMenu({ isDark }: Readonly<{ isDark: boolean }>) {
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState<string | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const t = themeTokens(isDark);

  async function handleLogout() {
    setOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("users")
        .select("full_name, profile_image_url")
        .eq("id", user.id)
        .single();
      if (data?.full_name) setFullName(data.full_name);
      if (data?.profile_image_url) setProfileImageUrl(data.profile_image_url);
    }
    loadUser();
  }, []);

  const initials = fullName
    ? fullName.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()
    : "...";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="true"
        className={`flex items-center gap-3 px-3 py-2 transition-colors ${isDark ? 'hover:bg-white/[0.05]' : 'hover:bg-black/[0.03]'}`}
      >
        {/* Avatar */}
        <div className={`flex h-8 w-8 items-center justify-center border ${t.borderDim} font-mono text-xs font-bold ${t.text} overflow-hidden`}>
          {profileImageUrl ? (
            <img src={profileImageUrl} alt={fullName ?? "User"} className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="hidden lg:block text-left">
          <div className={`font-mono text-xs ${t.text} tracking-wider`}>{fullName ?? "LOADING..."}</div>
          <div className={`font-mono text-[10px] ${t.textDim} tracking-[0.2em]`}>STUDENT</div>
        </div>
        {/* Chevron */}
        <svg
          width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
          className={`${t.textMid} transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className={`absolute right-0 top-[calc(100%+0.5rem)] min-w-[200px] border ${t.border} ${isDark ? 'bg-black' : 'bg-white'} p-2 z-50`}>
          <Link
            href="/student/profile"
            onClick={() => setOpen(false)}
            className={`flex w-full items-center gap-3 px-4 py-3 font-mono text-xs tracking-wider ${t.text} transition-colors ${isDark ? 'hover:bg-white/[0.05]' : 'hover:bg-black/[0.03]'}`}
          >
            <span className={`h-[16px] w-[16px] ${t.textMid}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            PROFILE
          </Link>

          <div className={`my-2 h-px ${t.divider}`} />

          <button
            onClick={handleLogout}
            className={`flex w-full items-center gap-3 px-4 py-3 font-mono text-xs tracking-wider transition-colors ${isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'}`}
          >
            <span className={`h-[16px] w-[16px] ${isDark ? 'text-red-400' : 'text-red-500'}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </span>
            LOG OUT
          </button>
        </div>
      )}
    </div>
  );
}
