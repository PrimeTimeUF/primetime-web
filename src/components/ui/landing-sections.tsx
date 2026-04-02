'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

// ─── Scroll-reveal hook ───────────────────────────────────────────────────────
function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

// ─── Spotlight hover ──────────────────────────────────────────────────────────
function useSpotlight(isDark: boolean) {
  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--sx', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--sy', `${e.clientY - rect.top}px`);
  };
  const onMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.removeProperty('--sx');
    e.currentTarget.style.removeProperty('--sy');
  };
  const spotStyle = isDark
    ? 'radial-gradient(260px circle at var(--sx,50%) var(--sy,50%), rgba(255,255,255,0.09), transparent 70%)'
    : 'radial-gradient(260px circle at var(--sx,50%) var(--sy,50%), rgba(0,0,0,0.06), transparent 70%)';
  return { onMouseMove, onMouseLeave, spotStyle };
}

// ─── SVG Feature Icons ────────────────────────────────────────────────────────
function IconAI({ stroke }: { stroke: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="w-8 h-8" aria-hidden>
      <circle cx="32" cy="32" r="28" stroke={stroke} strokeWidth="1.2" strokeDasharray="4 3"
        className="origin-center" style={{ animation: 'pt-orbit 20s linear infinite' }} />
      <circle cx="32" cy="32" r="16" stroke={stroke} strokeWidth="1.5" />
      <circle cx="32" cy="32" r="4" fill={stroke} />
      <line x1="32" y1="16" x2="32" y2="10" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="32" y1="54" x2="32" y2="48" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="10" y1="32" x2="16" y2="32" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="48" y1="32" x2="54" y2="32" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconAudio({ stroke }: { stroke: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="w-8 h-8" aria-hidden>
      <rect x="4" y="24" width="4" height="16" rx="2" fill={stroke}
        style={{ animation: 'pt-waveform 1.2s ease-in-out infinite', animationDelay: '0s' }} />
      <rect x="13" y="16" width="4" height="32" rx="2" fill={stroke}
        style={{ animation: 'pt-waveform 1.2s ease-in-out infinite', animationDelay: '0.15s' }} />
      <rect x="22" y="10" width="4" height="44" rx="2" fill={stroke}
        style={{ animation: 'pt-waveform 1.2s ease-in-out infinite', animationDelay: '0.3s' }} />
      <rect x="31" y="18" width="4" height="28" rx="2" fill={stroke}
        style={{ animation: 'pt-waveform 1.2s ease-in-out infinite', animationDelay: '0.45s' }} />
      <rect x="40" y="22" width="4" height="20" rx="2" fill={stroke}
        style={{ animation: 'pt-waveform 1.2s ease-in-out infinite', animationDelay: '0.6s' }} />
      <rect x="49" y="26" width="4" height="12" rx="2" fill={stroke}
        style={{ animation: 'pt-waveform 1.2s ease-in-out infinite', animationDelay: '0.75s' }} />
      <rect x="58" y="28" width="4" height="8" rx="2" fill={stroke}
        style={{ animation: 'pt-waveform 1.2s ease-in-out infinite', animationDelay: '0.9s' }} />
    </svg>
  );
}

function IconDashboard({ stroke }: { stroke: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="w-8 h-8" aria-hidden>
      <rect x="4" y="4" width="26" height="26" rx="4" stroke={stroke} strokeWidth="1.5" />
      <rect x="34" y="4" width="26" height="12" rx="4" stroke={stroke} strokeWidth="1.5" />
      <rect x="34" y="20" width="26" height="10" rx="4" stroke={stroke} strokeWidth="1.5" />
      <rect x="4" y="34" width="12" height="26" rx="4" stroke={stroke} strokeWidth="1.5" />
      <rect x="20" y="34" width="40" height="26" rx="4" stroke={stroke} strokeWidth="1.5" />
      <line x1="12" y1="17" x2="22" y2="17" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="22" x2="18" y2="22" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconAnalytics({ stroke }: { stroke: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="w-8 h-8" aria-hidden>
      <polyline points="4,52 18,32 28,40 40,20 52,28 60,12"
        stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        style={{ strokeDasharray: 120, animation: 'pt-connector 1.8s ease-out forwards' }} />
      <circle cx="18" cy="32" r="2.5" fill={stroke} />
      <circle cx="28" cy="40" r="2.5" fill={stroke} />
      <circle cx="40" cy="20" r="2.5" fill={stroke} />
      <circle cx="52" cy="28" r="2.5" fill={stroke} />
      <line x1="4" y1="56" x2="60" y2="56" stroke={stroke} strokeWidth="1" opacity="0.4" />
    </svg>
  );
}

function IconCode({ stroke }: { stroke: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="w-8 h-8" aria-hidden>
      <rect x="4" y="4" width="56" height="56" rx="8" stroke={stroke} strokeWidth="1.5" />
      <text x="14" y="38" fontFamily="monospace" fontSize="22" fontWeight="700" fill={stroke} opacity="0.9">#</text>
      <line x1="38" y1="20" x2="52" y2="20" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="38" y1="28" x2="48" y2="28" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="38" y1="36" x2="52" y2="36" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="38" y1="44" x2="44" y2="44" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconDoc({ stroke }: { stroke: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="w-8 h-8" aria-hidden>
      <path d="M12 4h28l12 12v44H12V4z" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M40 4v12h12" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
      <line x1="20" y1="28" x2="44" y2="28" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="20" y1="36" x2="44" y2="36" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="20" y1="44" x2="34" y2="44" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface LandingSectionsProps {
  isDark: boolean;
}

// ─── Section label ────────────────────────────────────────────────────────────
function SectionLabel({ num, label, textMid, line }: { num: string; label: string; textMid: string; line: string }) {
  return (
    <div className="flex items-center gap-2 mb-4 opacity-60">
      <div className={`w-8 h-px ${line}`} />
      <span className={`${textMid} text-[10px] font-mono tracking-wider`}>{num}</span>
      <div className={`flex-1 h-px ${line}`} />
      <span className={`${textMid} text-[10px] font-mono tracking-[0.3em] uppercase`}>{label}</span>
      <div className={`w-4 h-px ${line}`} />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function LandingSections({ isDark }: LandingSectionsProps) {
  // Theme tokens
  const bg       = isDark ? 'bg-black'         : 'bg-white';
  const text     = isDark ? 'text-white'        : 'text-black';
  const textMid  = isDark ? 'text-white/60'     : 'text-black/50';
  const textDim  = isDark ? 'text-white/40'     : 'text-black/35';
  const border   = isDark ? 'border-white/15'   : 'border-black/12';
  const cardBg   = isDark ? 'bg-white/[0.03]'   : 'bg-black/[0.02]';
  const line     = isDark ? 'bg-white/40'       : 'bg-black/25';
  const stroke   = isDark ? '#ffffff'           : '#000000';
  // ── FEATURES ──────────────────────────────────────────────────────────────
  const { ref: featRef, visible: featVisible } = useReveal();
  const spot = useSpotlight(isDark);

  const features = [
    {
      num: '01',
      icon: <IconAI stroke={stroke} />,
      title: 'AI-GENERATED SESSIONS',
      desc: 'Upload your lecture PDFs and Claude synthesizes structured priming sessions — key concepts, vocabulary, and context students need before class.',
      tag: 'CLAUDE API',
      wide: true,
    },
    {
      num: '02',
      icon: <IconAudio stroke={stroke} />,
      title: 'AUDIO PLAYER',
      desc: 'Neural TTS narrates every session. Students listen on the walk to campus at their own pace.',
      tag: 'GOOGLE TTS',
      wide: false,
    },
    {
      num: '03',
      icon: <IconDashboard stroke={stroke} />,
      title: 'TEACHER DASHBOARD',
      desc: 'Manage courses, upload materials per lecture, assign due dates, and view enrollment at a glance.',
      tag: 'COURSE TOOLS',
      wide: false,
    },
    {
      num: '04',
      icon: <IconAnalytics stroke={stroke} />,
      title: 'PROGRESS TRACKING',
      desc: 'Students track their completed sessions. Teachers monitor class-wide engagement.',
      tag: 'ANALYTICS',
      wide: false,
    },
    {
      num: '05',
      icon: <IconCode stroke={stroke} />,
      title: 'COURSE ENROLLMENT',
      desc: 'Students join instantly with a unique course code — no lengthy setup, no friction.',
      tag: 'INSTANT JOIN',
      wide: false,
    },
    {
      num: '06',
      icon: <IconDoc stroke={stroke} />,
      title: 'STRUCTURED CONTENT',
      desc: 'Sessions render as clean, scannable text — optimized for comprehension, never a wall of prose.',
      tag: 'READING UX',
      wide: false,
    },
  ];

  // ── HOW IT WORKS ─────────────────────────────────────────────────────────
  const { ref: howRef, visible: howVisible } = useReveal();

  const steps = [
    { num: '01', title: 'UPLOAD', body: 'Teacher uploads PDF lecture materials to their course folder.' },
    { num: '02', title: 'GENERATE', body: 'Claude AI reads the material and produces a structured priming session.' },
    { num: '03', title: 'ASSIGN', body: 'Set a due date. Students receive access to read or listen.' },
    { num: '04', title: 'ARRIVE READY', body: 'Students walk in primed. Class time is spent on depth, not catch-up.' },
  ];

  // ── AUDIENCE SPLIT ───────────────────────────────────────────────────────
  const { ref: audienceRef, visible: audienceVisible } = useReveal();

  const teacherFeatures = [
    'Create courses & upload PDF materials',
    'AI generates sessions from your content',
    'Assign due dates per lecture',
    'Monitor student enrollment & progress',
    'Preview sessions before students see them',
  ];

  const studentFeatures = [
    'Join any course with a simple code',
    'Read structured sessions before class',
    'Listen via audio on the go',
    'Track your completion history',
    'Arrive to every class prepared',
  ];

  // ── CTA ──────────────────────────────────────────────────────────────────
  const { ref: ctaRef, visible: ctaVisible } = useReveal();

  return (
    <div className={`${bg} transition-colors duration-500`}>

      {/* ── SECTION: FEATURES ─────────────────────────────────────────────── */}
      <section className="relative border-t border-b" style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
        {/* Subtle grid background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `linear-gradient(${isDark ? 'rgba(255,255,255,1)' : 'rgba(0,0,0,1)'} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? 'rgba(255,255,255,1)' : 'rgba(0,0,0,1)'} 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
          }}
        />

        <div
          ref={featRef}
          className={`pt-reveal container mx-auto px-6 lg:px-16 py-20 lg:py-32 ${featVisible ? 'pt-visible' : ''}`}
        >
          <SectionLabel num="002" label="CORE FUNCTIONALITY" textMid={textMid} line={line} />

          <div className="mb-12">
            <h2 className={`text-2xl lg:text-4xl font-mono font-bold ${text} tracking-wider leading-tight mb-3`}>
              EVERYTHING YOUR<br className="hidden lg:block" /> CLASSROOM NEEDS
            </h2>
            <p className={`font-mono text-sm ${textMid} max-w-xl leading-relaxed`}>
              From upload to comprehension — the full pipeline, automated.
            </p>
          </div>

          {/* Bento grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {features.map((f, i) => (
              <div
                key={f.num}
                onMouseMove={spot.onMouseMove}
                onMouseLeave={spot.onMouseLeave}
                className={`pt-reveal-sm ${featVisible ? 'pt-visible' : ''} group relative overflow-hidden rounded-none border ${border} ${cardBg} p-6 cursor-default transition-all duration-300 hover:-translate-y-0.5 ${f.wide ? 'md:col-span-2 lg:col-span-1' : ''}`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {/* Spotlight */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: spot.spotStyle }}
                />
                {/* Corner accent */}
                <div className={`absolute top-0 left-0 w-4 h-4 border-t border-l ${border} opacity-60`} />
                <div className={`absolute bottom-0 right-0 w-4 h-4 border-b border-r ${border} opacity-60`} />

                <div className="relative z-10">
                  {/* Number */}
                  <div className={`font-mono text-[10px] ${textDim} tracking-[0.3em] mb-4`}>{f.num}</div>
                  {/* Icon */}
                  <div className="mb-4">{f.icon}</div>
                  {/* Title */}
                  <h3 className={`font-mono font-bold text-sm ${text} tracking-widest mb-2`}>{f.title}</h3>
                  {/* Description */}
                  <p className={`font-mono text-xs ${textMid} leading-relaxed mb-4`}>{f.desc}</p>
                  {/* Tag */}
                  <div className={`inline-flex items-center gap-1.5 border ${border} px-2 py-1`}>
                    <div className={`w-1 h-1 rounded-full ${isDark ? 'bg-white/60' : 'bg-black/50'} animate-pulse`} />
                    <span className={`font-mono text-[9px] ${textDim} tracking-[0.25em]`}>{f.tag}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION: HOW IT WORKS ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          ref={howRef}
          className={`pt-reveal container mx-auto px-6 lg:px-16 py-20 lg:py-32 ${howVisible ? 'pt-visible' : ''}`}
        >
          <SectionLabel num="003" label="THE PROCESS" textMid={textMid} line={line} />

          <div className="mb-12">
            <h2 className={`text-2xl lg:text-4xl font-mono font-bold ${text} tracking-wider leading-tight mb-3`}>
              HOW IT WORKS
            </h2>
            <p className={`font-mono text-sm ${textMid} max-w-lg leading-relaxed`}>
              Four steps from raw material to prepared students.
            </p>
          </div>

          {/* Steps — vertical on mobile, horizontal on desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-0">
            {steps.map((step, i) => (
              <div key={step.num} className="relative">
                {/* Connector line (desktop) */}
                {i < steps.length - 1 && (
                  <div
                    className={`hidden lg:block absolute h-px ${isDark ? 'bg-white/20' : 'bg-black/15'} z-0`}
                    style={{ top: '44px', left: '64px', width: 'calc(100% - 40px)' }}
                  />
                )}
                {/* Connector line (mobile) */}
                {i < steps.length - 1 && (
                  <div className={`lg:hidden absolute top-full left-8 w-px h-8 ${isDark ? 'bg-white/20' : 'bg-black/15'}`} />
                )}

                <div
                  className={`pt-reveal-sm ${howVisible ? 'pt-visible' : ''} relative z-10 p-6 lg:pr-8`}
                  style={{ animationDelay: `${i * 120}ms` }}
                >
                  {/* Step indicator */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 border ${border} flex items-center justify-center relative`}>
                      <span className={`font-mono text-xs font-bold ${text}`}>{step.num}</span>
                      <div className={`absolute -top-0.5 -left-0.5 w-2 h-2 border-t border-l ${isDark ? 'border-white/40' : 'border-black/30'}`} />
                    </div>
                    <div className={`h-px flex-1 lg:hidden ${isDark ? 'bg-white/15' : 'bg-black/10'}`} />
                  </div>
                  <h3 className={`font-mono font-bold text-sm ${text} tracking-[0.25em] mb-2`}>{step.title}</h3>
                  <p className={`font-mono text-xs ${textMid} leading-relaxed`}>{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION: AUDIENCE SPLIT ───────────────────────────────────────── */}
      <section
        className="relative border-t border-b"
        style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}
      >
        <div
          ref={audienceRef}
          className={`pt-reveal container mx-auto px-6 lg:px-16 py-20 lg:py-32 ${audienceVisible ? 'pt-visible' : ''}`}
        >
          <SectionLabel num="004" label="BUILT FOR BOTH SIDES" textMid={textMid} line={line} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-px" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
            {/* Teachers */}
            <div
              className={`pt-reveal-sm ${audienceVisible ? 'pt-visible' : ''} relative p-8 lg:p-12 ${bg} group`}
              style={{ animationDelay: '0ms' }}
            >
              <div className={`absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 ${isDark ? 'border-white/30' : 'border-black/25'}`} />
              <div className={`font-mono text-[10px] ${textDim} tracking-[0.35em] mb-6`}>FOR TEACHERS</div>
              <h3 className={`font-mono font-bold text-xl lg:text-2xl ${text} tracking-wider mb-6 leading-tight`}>
                BUILD ONCE,<br />TEACH BETTER
              </h3>
              <ul className="space-y-3">
                {teacherFeatures.map((feat, i) => (
                  <li
                    key={i}
                    className={`pt-reveal-sm ${audienceVisible ? 'pt-visible' : ''} flex items-start gap-3`}
                    style={{ animationDelay: `${100 + i * 70}ms` }}
                  >
                    <div className={`mt-1.5 w-1.5 h-1.5 border ${isDark ? 'border-white/50' : 'border-black/40'} flex-shrink-0`} />
                    <span className={`font-mono text-xs ${textMid} leading-relaxed`}>{feat}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link href="/signup">
                  <button className={`relative font-mono text-xs ${text} border ${isDark ? 'border-white' : 'border-black'} px-5 py-2.5 ${isDark ? 'hover:bg-white hover:text-black' : 'hover:bg-black hover:text-white'} transition-all duration-200 group`}>
                    <span className={`absolute -top-1 -left-1 w-2 h-2 border-t border-l ${isDark ? 'border-white' : 'border-black'} opacity-0 group-hover:opacity-100 transition-opacity`} />
                    START TEACHING →
                  </button>
                </Link>
              </div>
            </div>

            {/* Students */}
            <div
              className={`pt-reveal-sm ${audienceVisible ? 'pt-visible' : ''} relative p-8 lg:p-12 ${bg}`}
              style={{ animationDelay: '80ms' }}
            >
              <div className={`absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 ${isDark ? 'border-white/30' : 'border-black/25'}`} />
              <div className={`font-mono text-[10px] ${textDim} tracking-[0.35em] mb-6`}>FOR STUDENTS</div>
              <h3 className={`font-mono font-bold text-xl lg:text-2xl ${text} tracking-wider mb-6 leading-tight`}>
                ARRIVE TO CLASS<br />ALREADY AHEAD
              </h3>
              <ul className="space-y-3">
                {studentFeatures.map((feat, i) => (
                  <li
                    key={i}
                    className={`pt-reveal-sm ${audienceVisible ? 'pt-visible' : ''} flex items-start gap-3`}
                    style={{ animationDelay: `${180 + i * 70}ms` }}
                  >
                    <div className={`mt-1.5 w-1.5 h-1.5 border ${isDark ? 'border-white/50' : 'border-black/40'} flex-shrink-0`} />
                    <span className={`font-mono text-xs ${textMid} leading-relaxed`}>{feat}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link href="/signup">
                  <button className={`font-mono text-xs ${isDark ? 'text-white/70 border-white/40 hover:text-white hover:border-white' : 'text-black/60 border-black/35 hover:text-black hover:border-black'} border px-5 py-2.5 transition-all duration-200`}>
                    JOIN YOUR COURSE →
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION: FINAL CTA ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Radial glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: isDark
              ? 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(255,255,255,0.04), transparent)'
              : 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(0,0,0,0.03), transparent)',
          }}
        />

        <div
          ref={ctaRef}
          className={`pt-reveal container mx-auto px-6 lg:px-16 py-24 lg:py-40 text-center ${ctaVisible ? 'pt-visible' : ''}`}
        >
          {/* Decorative dots row */}
          <div className="flex justify-center gap-1 mb-8 opacity-30">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className={`w-0.5 h-0.5 rounded-full ${isDark ? 'bg-white' : 'bg-black'}`} />
            ))}
          </div>

          <div className={`font-mono text-[10px] ${textDim} tracking-[0.4em] mb-6`}>005 — GET STARTED</div>

          <h2 className={`text-3xl lg:text-6xl font-mono font-bold ${text} tracking-wider leading-tight mb-6`}>
            YOUR NEXT CLASS<br />
            <span className={`${isDark ? 'text-white/50' : 'text-black/40'}`}>STARTS HERE</span>
          </h2>

          <p className={`font-mono text-sm ${textMid} max-w-md mx-auto leading-relaxed mb-10`}>
            Join educators already using PrimeTime to transform how students prepare for class.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <button className={`relative font-mono text-sm ${text} border ${isDark ? 'border-white hover:bg-white hover:text-black' : 'border-black hover:bg-black hover:text-white'} px-8 py-3 transition-all duration-200 group min-w-[180px]`}>
                <span className={`absolute -top-1 -left-1 w-2.5 h-2.5 border-t border-l ${isDark ? 'border-white' : 'border-black'} opacity-0 group-hover:opacity-100 transition-opacity`} />
                <span className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b border-r ${isDark ? 'border-white' : 'border-black'} opacity-0 group-hover:opacity-100 transition-opacity`} />
                GET STARTED FREE
              </button>
            </Link>
            <Link href="/login">
              <button className={`font-mono text-sm ${isDark ? 'text-white/60 border-white/30 hover:text-white hover:border-white/60' : 'text-black/50 border-black/25 hover:text-black hover:border-black/50'} border px-8 py-3 transition-all duration-200 min-w-[180px]`}>
                SIGN IN
              </button>
            </Link>
          </div>

          {/* Bottom decoration */}
          <div className="flex items-center justify-center gap-3 mt-16 opacity-30">
            <div className={`h-px w-16 ${isDark ? 'bg-white' : 'bg-black'}`} />
            <span className={`font-mono text-[9px] ${isDark ? 'text-white' : 'text-black'} tracking-widest`}>∞ PRIMETIME</span>
            <div className={`h-px w-16 ${isDark ? 'bg-white' : 'bg-black'}`} />
          </div>
        </div>
      </section>
    </div>
  );
}
