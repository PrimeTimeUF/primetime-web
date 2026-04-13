"use client";

import { BrutalistCard, themeTokens } from "@/components/ui/dashboard-primitives";

interface StudentPerformanceStatsBarProps {
  sessionsCompleted: number;
  sessionsAssigned: number;
  avgScore: number;
  bestScore: number;
  isDark?: boolean;
}

function scoreColor(pct: number, isDark: boolean): string {
  if (pct >= 80) return isDark ? "text-green-400" : "text-green-600";
  if (pct >= 60) return isDark ? "text-amber-400" : "text-amber-600";
  return isDark ? "text-red-400" : "text-red-600";
}

export default function StudentPerformanceStatsBar({
  sessionsCompleted,
  sessionsAssigned,
  avgScore,
  bestScore,
  isDark = true,
}: StudentPerformanceStatsBarProps) {
  const t = themeTokens(isDark);

  const stats = [
    {
      label: "SESSIONS DONE",
      value: `${sessionsCompleted}/${sessionsAssigned}`,
      color: t.text,
    },
    {
      label: "COMPLETION",
      value: `${sessionsAssigned > 0 ? Math.round((sessionsCompleted / sessionsAssigned) * 100) : 0}%`,
      color: scoreColor(
        sessionsAssigned > 0 ? Math.round((sessionsCompleted / sessionsAssigned) * 100) : 0,
        isDark
      ),
    },
    { label: "AVG SCORE", value: `${avgScore}%`, color: scoreColor(avgScore, isDark) },
    { label: "BEST SCORE", value: `${bestScore}%`, color: scoreColor(bestScore, isDark) },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {stats.map((s) => (
        <BrutalistCard key={s.label} isDark={isDark}>
          <div className={`font-mono text-[10px] ${t.textDim} tracking-[0.25em] uppercase mb-2`}>{s.label}</div>
          <div className={`font-mono text-xl sm:text-2xl font-bold ${s.color} break-words`}>{s.value}</div>
        </BrutalistCard>
      ))}
    </div>
  );
}
