'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

interface HeroAsciiProps {
  isDark?: boolean;
  onToggle?: () => void;
}

export default function HeroAscii({ isDark: isDarkProp, onToggle }: HeroAsciiProps = {}) {
  const [isDarkInternal, setIsDarkInternal] = useState(true);
  const isDark = isDarkProp !== undefined ? isDarkProp : isDarkInternal;
  const setIsDark = onToggle
    ? (_val: boolean) => onToggle()
    : (val: boolean) => setIsDarkInternal(val);

  useEffect(() => {
    const embedScript = document.createElement('script');
    embedScript.type = 'text/javascript';
    embedScript.textContent = `
      !function(){
        if(!window.UnicornStudio){
          window.UnicornStudio={isInitialized:!1};
          var i=document.createElement("script");
          i.src="https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.33/dist/unicornStudio.umd.js";
          i.onload=function(){
            window.UnicornStudio.isInitialized||(UnicornStudio.init(),window.UnicornStudio.isInitialized=!0)
          };
          (document.head || document.body).appendChild(i)
        }
      }();
    `;
    document.head.appendChild(embedScript);

    const style = document.createElement('style');
    style.textContent = `
      [data-us-project] {
        position: relative !important;
        overflow: hidden !important;
      }
      [data-us-project] canvas {
        clip-path: inset(0 0 10% 0) !important;
      }
      [data-us-project] * {
        pointer-events: none !important;
      }
      [data-us-project] a[href*="unicorn"],
      [data-us-project] button[title*="unicorn"],
      [data-us-project] div[title*="Made with"],
      [data-us-project] .unicorn-brand,
      [data-us-project] [class*="brand"],
      [data-us-project] [class*="credit"],
      [data-us-project] [class*="watermark"] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        position: absolute !important;
        left: -9999px !important;
        top: -9999px !important;
      }
    `;
    document.head.appendChild(style);

    const hideBranding = () => {
      const projectDiv = document.querySelector('[data-us-project]');
      if (projectDiv) {
        const allElements = projectDiv.querySelectorAll('*');
        allElements.forEach(el => {
          const text = (el.textContent || '').toLowerCase();
          if (text.includes('made with') || text.includes('unicorn')) {
            el.remove();
          }
        });
      }
    };

    hideBranding();
    const interval = setInterval(hideBranding, 100);
    setTimeout(hideBranding, 1000);
    setTimeout(hideBranding, 3000);
    setTimeout(hideBranding, 5000);

    return () => {
      clearInterval(interval);
      if (document.head.contains(embedScript)) document.head.removeChild(embedScript);
      if (document.head.contains(style)) document.head.removeChild(style);
    };
  }, []);

  // Shorthand helpers for theme-conditional classes
  const bg      = isDark ? 'bg-black'     : 'bg-white';
  const text     = isDark ? 'text-white'   : 'text-black';
  const textMid  = isDark ? 'text-white/60' : 'text-black/50';
  const textDim  = isDark ? 'text-white/50' : 'text-black/40';
  const textBody = isDark ? 'text-gray-300' : 'text-gray-600';
  const border   = isDark ? 'border-white/20' : 'border-black/20';
  const borderFull = isDark ? 'border-white'    : 'border-black';
  const borderMid  = isDark ? 'border-white/30' : 'border-black/25';
  const borderDim  = isDark ? 'border-white/60' : 'border-black/40';
  const divider  = isDark ? 'bg-white/40'  : 'bg-black/30';
  const dot      = isDark ? 'bg-white/40'  : 'bg-black/30';
  const line     = isDark ? 'bg-white'     : 'bg-black';
  const footerBg = isDark ? 'bg-black/40'  : 'bg-white/80';
  const barBg    = isDark ? 'bg-white/30'  : 'bg-black/20';
  const pulseDot1 = isDark ? 'bg-white/60' : 'bg-black/50';
  const pulseDot2 = isDark ? 'bg-white/40' : 'bg-black/30';
  const pulseDot3 = isDark ? 'bg-white/20' : 'bg-black/15';

  return (
    <main className={`relative min-h-screen overflow-hidden transition-colors duration-500 ${bg}`}>
      {/* Vitruvian man animation — visible on all screens */}
      <div
        className="absolute inset-0 w-full h-full transition-all duration-500"
        style={isDark
          ? { opacity: 1 }
          : { filter: 'invert(1)', opacity: 0.85 }
        }
      >
        <div
          data-us-project="whwOGlfJ5Rz2rHaEUgHl"
          style={{ width: '100%', height: '100%', minHeight: '100vh' }}
        />
      </div>

      {/* Mobile readability overlay — gradient fades from solid bg on left to transparent on right */}
      <div
        className="absolute inset-0 z-[1] lg:hidden pointer-events-none transition-colors duration-500"
        style={{
          background: isDark
            ? 'linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.15) 100%)'
            : 'linear-gradient(to right, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.15) 100%)',
        }}
      />

      {/* Top Header */}
      <div className={`absolute top-0 left-0 right-0 z-20 border-b ${border} transition-colors duration-500`}>
        <div className="container mx-auto px-4 lg:px-8 py-3 lg:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 lg:gap-4">
            <div className={`font-mono ${text} text-xl lg:text-2xl font-bold tracking-widest italic transform -skew-x-12 transition-colors duration-500`}>
              PRIMETIME
            </div>
            <div className={`h-3 lg:h-4 w-px ${divider} transition-colors duration-500`} />
            <span className={`${textMid} text-[8px] lg:text-[10px] font-mono transition-colors duration-500`}>EST. 2025</span>
          </div>

          <div className="flex items-center gap-3 lg:gap-5">
            <div className={`hidden lg:flex items-center gap-3 text-[10px] font-mono ${textMid} transition-colors duration-500`}>
              <span>AI-POWERED</span>
              <div className={`w-1 h-1 ${dot} rounded-full transition-colors duration-500`} />
              <span>CLASSROOM SESSIONS</span>
            </div>

            {/* Theme toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              className={`flex items-center justify-center w-8 h-8 border ${borderDim} ${text} hover:${isDark ? 'bg-white hover:text-black' : 'bg-black hover:text-white'} transition-all duration-200 font-mono`}
              aria-label="Toggle light/dark mode"
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </div>
      </div>

      {/* Corner Frame Accents */}
      <div className={`absolute top-0 left-0 w-8 h-8 lg:w-12 lg:h-12 border-t-2 border-l-2 ${borderMid} z-20 transition-colors duration-500`} />
      <div className={`absolute top-0 right-0 w-8 h-8 lg:w-12 lg:h-12 border-t-2 border-r-2 ${borderMid} z-20 transition-colors duration-500`} />
      <div className={`absolute left-0 w-8 h-8 lg:w-12 lg:h-12 border-b-2 border-l-2 ${borderMid} z-20 transition-colors duration-500`} style={{ bottom: '5vh' }} />
      <div className={`absolute right-0 w-8 h-8 lg:w-12 lg:h-12 border-b-2 border-r-2 ${borderMid} z-20 transition-colors duration-500`} style={{ bottom: '5vh' }} />

      <div className="relative z-10 flex min-h-screen items-center pt-16 lg:pt-0" style={{ marginTop: '5vh' }}>
        <div className="container mx-auto px-6 lg:px-16 lg:ml-[10%]">
          <div className="max-w-lg relative">
            {/* Top decorative line */}
            <div className="flex items-center gap-2 mb-3 opacity-60">
              <div className={`w-8 h-px ${line} transition-colors duration-500`} />
              <span className={`${text} text-[10px] font-mono tracking-wider transition-colors duration-500`}>001</span>
              <div className={`flex-1 h-px ${line} transition-colors duration-500`} />
            </div>

            {/* Title */}
            <div className="relative">
              <div className={`hidden lg:block absolute -left-3 top-0 bottom-0 w-1 dither-pattern opacity-40 ${text} transition-colors duration-500`} />
              <h1 className={`text-2xl lg:text-5xl font-bold ${text} mb-3 lg:mb-4 leading-tight font-mono tracking-wider transition-colors duration-500`} style={{ letterSpacing: '0.1em' }}>
                ELEVATE
                <span className="block mt-1 lg:mt-2 opacity-90">
                  YOUR CLASS
                </span>
              </h1>
            </div>

            {/* Decorative dots - desktop only */}
            <div className="hidden lg:flex gap-1 mb-3 opacity-40">
              {Array.from({ length: 40 }).map((_, i) => (
                <div key={i} className={`w-0.5 h-0.5 ${line} rounded-full transition-colors duration-500`} />
              ))}
            </div>

            {/* Description */}
            <div className="relative">
              <p className={`text-xs lg:text-base ${textBody} mb-5 lg:mb-6 leading-relaxed font-mono opacity-80 transition-colors duration-500`}>
                AI-generated priming sessions from your course materials — prepare students before they walk in the door.
              </p>

              <div className={`hidden lg:block absolute -right-4 top-1/2 w-3 h-3 border ${borderFull} opacity-30 transition-colors duration-500`} style={{ transform: 'translateY(-50%)' }}>
                <div className={`absolute top-1/2 left-1/2 w-1 h-1 ${line} transition-colors duration-500`} style={{ transform: 'translate(-50%, -50%)' }} />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
              <Link href="/signup">
                <button className={`relative px-5 lg:px-6 py-2 lg:py-2.5 bg-transparent ${text} font-mono text-xs lg:text-sm border ${borderFull} ${isDark ? 'hover:bg-white hover:text-black' : 'hover:bg-black hover:text-white'} transition-all duration-200 group w-full lg:w-auto`}>
                  <span className={`hidden lg:block absolute -top-1 -left-1 w-2 h-2 border-t border-l ${borderFull} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  <span className={`hidden lg:block absolute -bottom-1 -right-1 w-2 h-2 border-b border-r ${borderFull} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  GET STARTED
                </button>
              </Link>

              <Link href="/login">
                <button className={`relative px-5 lg:px-6 py-2 lg:py-2.5 bg-transparent border ${borderDim} ${isDark ? 'text-white/80' : 'text-black/70'} font-mono text-xs lg:text-sm ${isDark ? 'hover:bg-white hover:text-black hover:border-white' : 'hover:bg-black hover:text-white hover:border-black'} transition-all duration-200 w-full lg:w-auto`}>
                  SIGN IN
                </button>
              </Link>
            </div>

            {/* Bottom technical notation - desktop only */}
            <div className="hidden lg:flex items-center gap-2 mt-6 opacity-40">
              <span className={`${text} text-[9px] font-mono transition-colors duration-500`}>∞</span>
              <div className={`flex-1 h-px ${line} transition-colors duration-500`} />
              <span className={`${text} text-[9px] font-mono transition-colors duration-500`}>PRIMETIME</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className={`absolute left-0 right-0 z-20 border-t ${border} ${footerBg} backdrop-blur-sm transition-colors duration-500`} style={{ bottom: '5vh' }}>
        <div className="container mx-auto px-4 lg:px-8 py-2 lg:py-3 flex items-center justify-between">
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
            <span className="hidden lg:inline">◐ RENDERING</span>
            <div className="flex gap-1">
              <div className={`w-1 h-1 ${pulseDot1} rounded-full animate-pulse transition-colors duration-500`} />
              <div className={`w-1 h-1 ${pulseDot2} rounded-full animate-pulse transition-colors duration-500`} style={{ animationDelay: '0.2s' }} />
              <div className={`w-1 h-1 ${pulseDot3} rounded-full animate-pulse transition-colors duration-500`} style={{ animationDelay: '0.4s' }} />
            </div>
            <span className="hidden lg:inline">FRAME: ∞</span>
          </div>
        </div>
      </div>
    </main>
  );
}
