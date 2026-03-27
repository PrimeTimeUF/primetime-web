"use client";

import { forwardRef } from "react";

/* ================================================================== */
/*  Theme helpers                                                      */
/* ================================================================== */

export function themeTokens(isDark: boolean) {
  return {
    text: isDark ? 'text-white' : 'text-black',
    textMid: isDark ? 'text-white/60' : 'text-black/50',
    textDim: isDark ? 'text-white/40' : 'text-black/35',
    border: isDark ? 'border-white/15' : 'border-black/12',
    borderMid: isDark ? 'border-white/30' : 'border-black/25',
    borderFull: isDark ? 'border-white' : 'border-black',
    borderDim: isDark ? 'border-white/60' : 'border-black/40',
    cardBg: isDark ? 'bg-white/[0.03]' : 'bg-black/[0.02]',
    line: isDark ? 'bg-white/40' : 'bg-black/25',
    bg: isDark ? 'bg-black' : 'bg-white',
    stroke: isDark ? '#ffffff' : '#000000',
    divider: isDark ? 'bg-white/15' : 'bg-black/12',
  };
}

/* ================================================================== */
/*  Grid Background                                                    */
/* ================================================================== */

export function GridBackground({ isDark }: Readonly<{ isDark: boolean }>) {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.025]"
      style={{
        backgroundImage: `linear-gradient(${isDark ? 'rgba(255,255,255,1)' : 'rgba(0,0,0,1)'} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? 'rgba(255,255,255,1)' : 'rgba(0,0,0,1)'} 1px, transparent 1px)`,
        backgroundSize: '80px 80px',
      }}
    />
  );
}

/* ================================================================== */
/*  Section Label                                                      */
/* ================================================================== */

interface SectionLabelProps {
  num: string;
  label: string;
  isDark: boolean;
}

export function SectionLabel({ num, label, isDark }: Readonly<SectionLabelProps>) {
  const t = themeTokens(isDark);
  return (
    <div className="flex items-center gap-2 mb-4 opacity-60">
      <div className={`w-6 h-px ${t.line}`} />
      <span className={`${t.textMid} text-[10px] font-mono tracking-wider`}>{num}</span>
      <div className={`flex-1 h-px ${t.line}`} />
      <span className={`${t.textMid} text-[10px] font-mono tracking-[0.3em] uppercase`}>{label}</span>
      <div className={`w-4 h-px ${t.line}`} />
    </div>
  );
}

/* ================================================================== */
/*  Corner Accents                                                     */
/* ================================================================== */

export function CornerAccents({ isDark }: Readonly<{ isDark: boolean }>) {
  const t = themeTokens(isDark);
  return (
    <>
      <div className={`absolute top-0 left-0 w-4 h-4 border-t border-l ${t.border} opacity-60`} />
      <div className={`absolute top-0 right-0 w-4 h-4 border-t border-r ${t.border} opacity-60`} />
      <div className={`absolute bottom-0 left-0 w-4 h-4 border-b border-l ${t.border} opacity-60`} />
      <div className={`absolute bottom-0 right-0 w-4 h-4 border-b border-r ${t.border} opacity-60`} />
    </>
  );
}

/* ================================================================== */
/*  Brutalist Card                                                     */
/* ================================================================== */

interface BrutalistCardProps {
  isDark: boolean;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  as?: "div" | "article";
}

export function BrutalistCard({ isDark, children, className = "", onClick, as: Tag = "div" }: Readonly<BrutalistCardProps>) {
  const t = themeTokens(isDark);
  // Detect if className contains flex/grid to pass layout classes to the inner wrapper
  const hasFlex = /\bflex\b/.test(className);
  const hasGrid = /\bgrid\b/.test(className);
  const innerLayout = hasFlex || hasGrid ? className.split(' ').filter(c => /^(flex|items-|justify-|gap-|!p-|space-)/.test(c) || c === 'flex').join(' ') : '';
  const outerClasses = hasFlex || hasGrid ? className.split(' ').filter(c => !/^(flex|items-|justify-|gap-|!p-|space-)/.test(c) && c !== 'flex').join(' ') : className;

  return (
    <Tag
      onClick={onClick}
      className={`relative border ${t.border} ${t.cardBg} p-6 transition-all duration-200 ${onClick ? 'cursor-pointer' : ''} ${outerClasses}`}
    >
      <CornerAccents isDark={isDark} />
      <div className={`relative z-10 ${innerLayout}`}>{children}</div>
    </Tag>
  );
}

/* ================================================================== */
/*  Brutalist Button                                                   */
/* ================================================================== */

interface BrutalistButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isDark: boolean;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "default" | "lg";
  isLoading?: boolean;
  fullWidth?: boolean;
  iconBefore?: React.ReactNode;
  iconAfter?: React.ReactNode;
}

export const BrutalistButton = forwardRef<HTMLButtonElement, BrutalistButtonProps>(
  function BrutalistButton(
    { isDark, variant = "primary", size = "default", isLoading, fullWidth, iconBefore, iconAfter, children, className = "", disabled, ...rest },
    ref,
  ) {
    const t = themeTokens(isDark);

    const sizeClasses = {
      sm: "px-3 py-1.5 text-xs",
      default: "px-5 py-2.5 text-sm",
      lg: "px-7 py-3 text-sm",
    };

    const variantClasses = {
      primary: `border ${t.borderFull} ${t.text} ${isDark ? 'hover:bg-white hover:text-black' : 'hover:bg-black hover:text-white'}`,
      secondary: `border ${t.borderDim} ${isDark ? 'text-white/70' : 'text-black/60'} ${isDark ? 'hover:text-white hover:border-white' : 'hover:text-black hover:border-black'}`,
      ghost: `border border-transparent ${t.text} ${isDark ? 'hover:border-white/20' : 'hover:border-black/12'}`,
      danger: `border ${isDark ? 'border-red-500/40 text-red-400 hover:bg-red-500/10' : 'border-red-500/60 text-red-600 hover:bg-red-50'}`,
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`relative font-mono tracking-wider transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses[size]} ${variantClasses[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
        {...rest}
      >
        {variant === "primary" && (
          <>
            <span className={`absolute -top-1 -left-1 w-2 h-2 border-t border-l ${t.borderFull} opacity-0 group-hover:opacity-100 transition-opacity`} />
            <span className={`absolute -bottom-1 -right-1 w-2 h-2 border-b border-r ${t.borderFull} opacity-0 group-hover:opacity-100 transition-opacity`} />
          </>
        )}
        <span className="flex items-center justify-center gap-2">
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              LOADING...
            </>
          ) : (
            <>
              {iconBefore}
              {children}
              {iconAfter}
            </>
          )}
        </span>
      </button>
    );
  },
);

/* ================================================================== */
/*  Brutalist Input                                                    */
/* ================================================================== */

interface BrutalistInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  isDark: boolean;
  label?: string;
  error?: string;
}

export const BrutalistInput = forwardRef<HTMLInputElement, BrutalistInputProps>(
  function BrutalistInput({ isDark, label, error, className = "", ...rest }, ref) {
    const t = themeTokens(isDark);
    const errorBorder = isDark ? 'border-red-500/40' : 'border-red-500/60';
    const errorText = isDark ? 'text-red-400' : 'text-red-600';

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className={`font-mono text-[10px] ${t.textDim} tracking-[0.25em] uppercase`}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full border ${error ? errorBorder : t.border} bg-transparent ${t.text} font-mono text-sm px-4 py-3 placeholder:${isDark ? 'text-white/20' : 'text-black/25'} focus:outline-none focus:border-current transition-colors duration-200 ${className}`}
          {...rest}
        />
        {error && (
          <span className={`font-mono text-xs ${errorText}`}>{error}</span>
        )}
      </div>
    );
  },
);

/* ================================================================== */
/*  Brutalist Tab                                                      */
/* ================================================================== */

interface BrutalistTabProps {
  isDark: boolean;
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}

export function BrutalistTab({ isDark, label, count, active, onClick }: Readonly<BrutalistTabProps>) {
  const t = themeTokens(isDark);
  return (
    <button
      onClick={onClick}
      className={`relative font-mono text-xs tracking-[0.2em] uppercase px-4 py-3 transition-colors duration-200 ${active ? t.text : t.textMid} ${active ? '' : isDark ? 'hover:text-white/80' : 'hover:text-black/70'}`}
    >
      <span className="flex items-center gap-2">
        {label}
        {count !== undefined && (
          <span className={`border ${active ? t.borderFull : t.border} px-1.5 py-0.5 text-[10px] font-mono ${active ? t.text : t.textDim}`}>
            {count}
          </span>
        )}
      </span>
      {active && (
        <div className={`absolute bottom-0 left-0 right-0 h-px ${isDark ? 'bg-white' : 'bg-black'}`} />
      )}
    </button>
  );
}

/* ================================================================== */
/*  Brutalist Badge                                                    */
/* ================================================================== */

interface BrutalistBadgeProps {
  isDark: boolean;
  variant: "success" | "warning" | "error" | "info" | "purple";
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function BrutalistBadge({ isDark, variant, children, icon, className = "" }: Readonly<BrutalistBadgeProps>) {
  const colorMap = {
    success: isDark ? 'border-green-500/40 text-green-400' : 'border-green-600/50 text-green-700',
    warning: isDark ? 'border-amber-500/40 text-amber-400' : 'border-amber-600/50 text-amber-700',
    error: isDark ? 'border-red-500/40 text-red-400' : 'border-red-600/50 text-red-700',
    info: isDark ? 'border-blue-500/40 text-blue-400' : 'border-blue-600/50 text-blue-700',
    purple: isDark ? 'border-purple-500/40 text-purple-400' : 'border-purple-600/50 text-purple-700',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 border ${colorMap[variant]} px-2 py-0.5 font-mono text-[10px] tracking-wider uppercase ${className}`}>
      {icon}
      {children}
    </span>
  );
}

/* ================================================================== */
/*  Dashboard Footer                                                   */
/* ================================================================== */

export function DashboardFooter({ isDark }: Readonly<{ isDark: boolean }>) {
  const textDim = isDark ? 'text-white/50' : 'text-black/40';
  const border = isDark ? 'border-white/20' : 'border-black/20';
  const footerBg = isDark ? 'bg-black/40' : 'bg-white/80';
  const pulseDot1 = isDark ? 'bg-white/60' : 'bg-black/50';
  const pulseDot2 = isDark ? 'bg-white/40' : 'bg-black/30';
  const pulseDot3 = isDark ? 'bg-white/20' : 'bg-black/15';
  const barBg = isDark ? 'bg-white/30' : 'bg-black/20';

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-20 border-t ${border} ${footerBg} backdrop-blur-sm transition-colors duration-500`}>
      <div className="mx-auto max-w-[1200px] px-4 lg:px-8 py-2 lg:py-3 flex items-center justify-between">
        <div className={`flex items-center gap-3 lg:gap-6 text-[8px] lg:text-[9px] font-mono ${textDim} transition-colors duration-500`}>
          <span className="hidden lg:inline">SYSTEM.ACTIVE</span>
          <span className="lg:hidden">SYS.ACT</span>
          <div className="hidden lg:flex gap-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={`w-1 ${barBg} transition-colors duration-500`} style={{ height: `${(i % 3) * 4 + 4}px` }} />
            ))}
          </div>
          <span>V1.0.0</span>
        </div>
        <div className={`flex items-center gap-2 lg:gap-4 text-[8px] lg:text-[9px] font-mono ${textDim} transition-colors duration-500`}>
          <span className="hidden lg:inline">&diams; DASHBOARD</span>
          <div className="flex gap-1">
            <div className={`w-1 h-1 ${pulseDot1} rounded-full animate-pulse transition-colors duration-500`} />
            <div className={`w-1 h-1 ${pulseDot2} rounded-full animate-pulse transition-colors duration-500`} style={{ animationDelay: '0.2s' }} />
            <div className={`w-1 h-1 ${pulseDot3} rounded-full animate-pulse transition-colors duration-500`} style={{ animationDelay: '0.4s' }} />
          </div>
          <span className="hidden lg:inline">FRAME: &infin;</span>
        </div>
      </div>
    </div>
  );
}
