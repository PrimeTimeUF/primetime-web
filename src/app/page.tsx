'use client';

import { useState } from 'react';
import HeroAscii from '@/components/ui/hero-ascii';
import LandingSections from '@/components/ui/landing-sections';

export default function LandingPage() {
  const [isDark, setIsDark] = useState(true);
  return (
    <>
      <HeroAscii isDark={isDark} onToggle={() => setIsDark(d => !d)} />
      <LandingSections isDark={isDark} />
    </>
  );
}
