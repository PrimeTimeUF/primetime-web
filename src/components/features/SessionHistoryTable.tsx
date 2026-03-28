"use client";

import type { StudentSessionResult } from "@/lib/types/student-analytics";
import { BrutalistCard, BrutalistBadge, themeTokens } from "@/components/ui/dashboard-primitives";

interface SessionHistoryTableProps {
  results: StudentSessionResult[];
  isDark?: boolean;
}

function scoreBadgeVariant(score: number, total: number): "success" | "warning" | "error" {
  const pct = (score / total) * 100;
  if (pct >= 80) return "success";
  if (pct >= 60) return "warning";
  return "error";
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function SessionHistoryTable({ results, isDark = true }: SessionHistoryTableProps) {
  const t = themeTokens(isDark);

  if (results.length === 0) {
    return (
      <BrutalistCard isDark={isDark} className="flex flex-col items-center justify-center py-12 px-6">
        <svg
          className={`w-12 h-12 ${t.textDim} mb-4`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
          <path d="M9 14l2 2 4-4" />
        </svg>
        <p className={`font-mono text-sm ${t.textMid}`}>NO SESSIONS COMPLETED YET</p>
      </BrutalistCard>
    );
  }

  return (
    <BrutalistCard isDark={isDark} className="!p-0 overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className={`border-b ${t.border}`}>
            <th className={`px-5 py-3 font-mono text-[10px] font-medium ${t.textDim} uppercase tracking-[0.25em]`}>
              SESSION
            </th>
            <th className={`px-5 py-3 font-mono text-[10px] font-medium ${t.textDim} uppercase tracking-[0.25em]`}>
              SCORE
            </th>
            <th className={`px-5 py-3 font-mono text-[10px] font-medium ${t.textDim} uppercase tracking-[0.25em]`}>
              DATE
            </th>
          </tr>
        </thead>
        <tbody>
          {results.map((result, i) => (
            <tr
              key={result.id}
              className={`${i < results.length - 1 ? `border-b ${isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'}` : ''} transition-colors ${isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-black/[0.02]'}`}
            >
              <td className="px-5 py-4">
                <div className={`font-mono text-sm font-medium ${t.text}`}>
                  {result.session.title ?? "Untitled Session"}
                </div>
                <div className={`font-mono text-xs ${t.textDim}`}>
                  {result.course.course_code}
                </div>
              </td>
              <td className="px-5 py-4">
                <BrutalistBadge isDark={isDark} variant={scoreBadgeVariant(result.score, result.total_questions)}>
                  {result.score}/{result.total_questions}
                </BrutalistBadge>
              </td>
              <td className={`px-5 py-4 font-mono text-sm ${t.textMid}`}>
                {formatDate(result.completed_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </BrutalistCard>
  );
}
