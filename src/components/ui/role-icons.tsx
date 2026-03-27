interface IconProps {
  stroke: string;
}

export function StudentIcon({ stroke }: Readonly<IconProps>) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="w-8 h-8" aria-hidden>
      {/* Open book */}
      <path
        d="M8 16 L32 12 L56 16 L56 52 L32 48 L8 52 Z"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Center spine */}
      <line x1="32" y1="12" x2="32" y2="48" stroke={stroke} strokeWidth="1.5" />
      {/* Left page lines */}
      <line x1="14" y1="24" x2="28" y2="22" stroke={stroke} strokeWidth="1" strokeLinecap="round" opacity="0.6" />
      <line x1="14" y1="30" x2="28" y2="28" stroke={stroke} strokeWidth="1" strokeLinecap="round" opacity="0.6" />
      <line x1="14" y1="36" x2="28" y2="34" stroke={stroke} strokeWidth="1" strokeLinecap="round" opacity="0.6" />
      {/* Right page lines */}
      <line x1="36" y1="22" x2="50" y2="24" stroke={stroke} strokeWidth="1" strokeLinecap="round" opacity="0.6" />
      <line x1="36" y1="28" x2="50" y2="30" stroke={stroke} strokeWidth="1" strokeLinecap="round" opacity="0.6" />
      <line x1="36" y1="34" x2="50" y2="36" stroke={stroke} strokeWidth="1" strokeLinecap="round" opacity="0.6" />
      {/* Graduation cap above */}
      <polygon points="32,2 48,8 32,14 16,8" stroke={stroke} strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      <line x1="48" y1="8" x2="48" y2="16" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function TeacherIcon({ stroke }: Readonly<IconProps>) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="w-8 h-8" aria-hidden>
      {/* Chalkboard */}
      <rect x="6" y="10" width="52" height="36" rx="2" stroke={stroke} strokeWidth="1.5" />
      {/* Board inner */}
      <rect x="10" y="14" width="44" height="28" stroke={stroke} strokeWidth="1" opacity="0.4" />
      {/* Writing on board */}
      <line x1="16" y1="22" x2="36" y2="22" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="16" y1="28" x2="32" y2="28" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="16" y1="34" x2="28" y2="34" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      {/* Chalk dot */}
      <circle cx="42" cy="34" r="2" fill={stroke} opacity="0.6" />
      {/* Stand legs */}
      <line x1="24" y1="46" x2="18" y2="58" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="40" y1="46" x2="46" y2="58" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      {/* Tray */}
      <line x1="20" y1="46" x2="44" y2="46" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
