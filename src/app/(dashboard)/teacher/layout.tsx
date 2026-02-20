"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface TeacherLayoutProps {
  children: React.ReactNode;
}

export default function TeacherLayout({ children }: Readonly<TeacherLayoutProps>) {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <main className="mx-auto max-w-[1200px] px-6 py-8">{children}</main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Dashboard Header                                                   */
/* ------------------------------------------------------------------ */

function DashboardHeader() {
  return (
    <header className="sticky top-0 z-50 h-16 border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-6">
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-8">
          <Link
            href="/teacher"
            className="text-xl font-bold tracking-tight text-black"
          >
            PrimeTime
          </Link>
          <SidebarNav />
        </div>

        {/* Right: User Menu */}
        <div className="flex items-center gap-4">
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/*  Sidebar Nav (horizontal in header)                                 */
/* ------------------------------------------------------------------ */

const NAV_ITEMS = [
  { label: "Courses", href: "/teacher" },
  { label: "Analytics", href: "/teacher/analytics" },
  { label: "Settings", href: "/teacher/settings" },
] as const;

function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1">
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/teacher"
            ? pathname === "/teacher"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-gray-100 text-black"
                : "text-gray-500 hover:bg-gray-100 hover:text-black"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/*  User Menu (dropdown)                                               */
/* ------------------------------------------------------------------ */

function UserMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  async function handleLogout() {
    setOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Close on Escape
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
        className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-gray-100"
      >
        {/* Avatar */}
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">
          DR
        </div>
        <div className="text-left">
          <div className="text-sm font-medium text-black">Dr. Rodriguez</div>
          <div className="text-xs text-gray-500">Teacher</div>
        </div>
        {/* Chevron */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] min-w-[200px] rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
          <DropdownItem
            href="/teacher/profile"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            }
            label="Profile"
            onClick={() => setOpen(false)}
          />
          <DropdownItem
            href="/teacher/settings"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            }
            label="Settings"
            onClick={() => setOpen(false)}
          />

          {/* Divider */}
          <div className="my-2 h-px bg-gray-100" />

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-4 py-3 text-sm text-red-500 transition-colors hover:bg-gray-100"
          >
            <span className="h-[18px] w-[18px] text-red-500">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </span>
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Dropdown Item                                                      */
/* ------------------------------------------------------------------ */

interface DropdownItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
  onClick?: () => void;
}

function DropdownItem({ href, icon, label, danger, onClick }: Readonly<DropdownItemProps>) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-md px-4 py-3 text-sm transition-colors hover:bg-gray-100 ${
        danger ? "text-red-500" : "text-black"
      }`}
    >
      <span className={`h-[18px] w-[18px] ${danger ? "text-red-500" : "text-gray-500"}`}>
        {icon}
      </span>
      {label}
    </Link>
  );
}
