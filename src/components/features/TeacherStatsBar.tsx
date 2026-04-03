"use client";

import { BrutalistCard, themeTokens } from "@/components/ui/dashboard-primitives";

interface TeacherStatsBarProps {
  totalStudents: number;
  sessionsAssigned: number;
  avgScore: number;
  completionRate: number;
  isDark?: boolean;
}

function scoreColor(pct: number, isDark: boolean): string {
  if (pct >= 80) return isDark ? "text-green-400" : "text-green-600";
  if (pct >= 60) return isDark ? "text-amber-400" : "text-amber-600";
  return isDark ? "text-red-400" : "text-red-600";
}

export default function TeacherStatsBar({
  totalStudents,
  sessionsAssigned,
  avgScore,
  completionRate,
  isDark = true,
}: TeacherStatsBarProps) {
  const t = themeTokens(isDark);

  const stats = [
    { label: "TOTAL STUDENTS", value: String(totalStudents), color: t.text },
    { label: "SESSIONS ASSIGNED", value: String(sessionsAssigned), color: t.text },
    { label: "AVG SCORE", value: `${avgScore}%`, color: scoreColor(avgScore, isDark) },
    { label: "COMPLETION RATE", value: `${completionRate}%`, color: scoreColor(completionRate, isDark) },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {stats.map((s) => (
        <BrutalistCard key={s.label} isDark={isDark}>
          <div className={`font-mono text-[10px] ${t.textDim} tracking-[0.25em] uppercase mb-2`}>{s.label}</div>
          <div className={`font-mono text-2xl font-bold ${s.color}`}>{s.value}</div>
        </BrutalistCard>
      ))}
    </div>
  );
}
