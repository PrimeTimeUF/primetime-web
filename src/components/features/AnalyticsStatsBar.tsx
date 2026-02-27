"use client";

import type { StudentAnalyticsSummary } from "@/lib/types/student-analytics";

interface AnalyticsStatsBarProps {
  summary: StudentAnalyticsSummary;
}

function scoreColor(percentage: number): string {
  if (percentage >= 80) return "text-green-600";
  if (percentage >= 60) return "text-yellow-600";
  return "text-red-600";
}

export default function AnalyticsStatsBar({ summary }: AnalyticsStatsBarProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Average Score */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="text-sm text-gray-500 mb-1">Average Score</div>
        <div className={`text-2xl font-semibold ${scoreColor(summary.average_score_percentage)}`}>
          {summary.average_score_percentage}%
        </div>
      </div>

      {/* Sessions Completed */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="text-sm text-gray-500 mb-1">Sessions Completed</div>
        <div className="text-2xl font-semibold text-black">
          {summary.total_sessions_completed}
        </div>
      </div>

      {/* Best Score */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="text-sm text-gray-500 mb-1">Best Score</div>
        <div className={`text-2xl font-semibold ${scoreColor(summary.best_score_percentage)}`}>
          {summary.best_score_percentage}%
        </div>
      </div>
    </div>
  );
}
