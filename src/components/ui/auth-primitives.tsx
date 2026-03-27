interface ThemeProps {
  isDark: boolean;
}

/* ------------------------------------------------------------------ */
/*  Icons                                                              */
/* ------------------------------------------------------------------ */

export function SunIcon() {
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

export function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Auth Header                                                        */
/* ------------------------------------------------------------------ */

interface AuthHeaderProps extends ThemeProps {
  onToggle: () => void;
}

export function AuthHeader({ isDark, onToggle }: Readonly<AuthHeaderProps>) {
  const text = isDark ? 'text-white' : 'text-black';
  const textMid = isDark ? 'text-white/60' : 'text-black/50';
  const border = isDark ? 'border-white/20' : 'border-black/20';
  const borderDim = isDark ? 'border-white/60' : 'border-black/40';
  const divider = isDark ? 'bg-white/40' : 'bg-black/30';
  const dot = isDark ? 'bg-white/40' : 'bg-black/30';

  return (
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

          <button
            onClick={onToggle}
            className={`flex items-center justify-center w-8 h-8 border ${borderDim} ${text} transition-all duration-200 font-mono`}
            aria-label="Toggle light/dark mode"
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Auth Footer                                                        */
/* ------------------------------------------------------------------ */

export function AuthFooter({ isDark }: Readonly<ThemeProps>) {
  const textDim = isDark ? 'text-white/50' : 'text-black/40';
  const border = isDark ? 'border-white/20' : 'border-black/20';
  const footerBg = isDark ? 'bg-black/40' : 'bg-white/80';
  const barBg = isDark ? 'bg-white/30' : 'bg-black/20';
  const pulseDot1 = isDark ? 'bg-white/60' : 'bg-black/50';
  const pulseDot2 = isDark ? 'bg-white/40' : 'bg-black/30';
  const pulseDot3 = isDark ? 'bg-white/20' : 'bg-black/15';

  return (
    <div className={`absolute bottom-0 left-0 right-0 z-20 border-t ${border} ${footerBg} backdrop-blur-sm transition-colors duration-500`}>
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
          <span className="hidden lg:inline">&diams; RENDERING</span>
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

/* ------------------------------------------------------------------ */
/*  Corner Accents                                                     */
/* ------------------------------------------------------------------ */

export function CornerAccents({ isDark }: Readonly<ThemeProps>) {
  const borderMid = isDark ? 'border-white/30' : 'border-black/25';

  return (
    <>
      <div className={`absolute top-0 left-0 w-8 h-8 lg:w-12 lg:h-12 border-t-2 border-l-2 ${borderMid} z-20 transition-colors duration-500`} />
      <div className={`absolute top-0 right-0 w-8 h-8 lg:w-12 lg:h-12 border-t-2 border-r-2 ${borderMid} z-20 transition-colors duration-500`} />
      <div className={`absolute bottom-0 left-0 w-8 h-8 lg:w-12 lg:h-12 border-b-2 border-l-2 ${borderMid} z-20 transition-colors duration-500`} />
      <div className={`absolute bottom-0 right-0 w-8 h-8 lg:w-12 lg:h-12 border-b-2 border-r-2 ${borderMid} z-20 transition-colors duration-500`} />
    </>
  );
}
