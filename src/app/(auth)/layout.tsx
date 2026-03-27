"use client";

import { useState } from "react";
import { AuthThemeContext } from "./auth-theme-context";
import { AuthHeader, AuthFooter, CornerAccents } from "@/components/ui/auth-primitives";

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [isDark, setIsDark] = useState(true);

  const bg = isDark ? 'bg-black' : 'bg-white';

  return (
    <AuthThemeContext.Provider value={{ isDark, toggle: () => setIsDark((v) => !v) }}>
      <div className={`relative min-h-screen overflow-hidden transition-colors duration-500 ${bg}`}>
        {/* Subtle grid background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `linear-gradient(${isDark ? 'rgba(255,255,255,1)' : 'rgba(0,0,0,1)'} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? 'rgba(255,255,255,1)' : 'rgba(0,0,0,1)'} 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
          }}
        />

        <AuthHeader isDark={isDark} onToggle={() => setIsDark((v) => !v)} />
        <CornerAccents isDark={isDark} />

        {/* Centered content */}
        <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-20">
          {children}
        </div>

        <AuthFooter isDark={isDark} />
      </div>
    </AuthThemeContext.Provider>
  );
}
