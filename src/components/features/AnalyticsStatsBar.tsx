"use client";

import type { StudentAnalyticsSummary } from "@/lib/types/student-analytics";
import { BrutalistCard, themeTokens } from "@/components/ui/dashboard-primitives";

interface AnalyticsStatsBarProps {
  summary: StudentAnalyticsSummary;
  isDark?: boolean;
}

function scoreColor(percentage: number, isDark: boolean): string {
  if (percentage >= 80) return isDark ? "text-green-400" : "text-green-600";
  if (percentage >= 60) return isDark ? "text-amber-400" : "text-amber-600";
  return isDark ? "text-red-400" : "text-red-600";
}

export default function AnalyticsStatsBar({ summary, isDark = true }: AnalyticsStatsBarProps) {
  const t = themeTokens(isDark);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Average Score */}
      <BrutalistCard isDark={isDark}>
        <div className={`font-mono text-[10px] ${t.textDim} tracking-[0.25em] uppercase mb-2`}>AVG SCORE</div>
        <div className={`font-mono text-2xl font-bold ${scoreColor(summary.average_score_percentage, isDark)}`}>
          {summary.average_score_percentage}%
        </div>
      </BrutalistCard>

      {/* Sessions Completed */}
      <BrutalistCard isDark={isDark}>
        <div className={`font-mono text-[10px] ${t.textDim} tracking-[0.25em] uppercase mb-2`}>SESSIONS DONE</div>
        <div className={`font-mono text-2xl font-bold ${t.text}`}>
          {summary.total_sessions_completed}
        </div>
      </BrutalistCard>

      {/* Best Score */}
      <BrutalistCard isDark={isDark}>
        <div className={`font-mono text-[10px] ${t.textDim} tracking-[0.25em] uppercase mb-2`}>BEST SCORE</div>
        <div className={`font-mono text-2xl font-bold ${scoreColor(summary.best_score_percentage, isDark)}`}>
          {summary.best_score_percentage}%
        </div>
      </BrutalistCard>
    </div>
  );
}
