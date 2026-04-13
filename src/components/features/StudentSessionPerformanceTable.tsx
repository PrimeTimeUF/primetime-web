"use client";

import type { StudentSessionPerformance } from "@/lib/types/student-performance";
import { BrutalistCard, BrutalistBadge, themeTokens } from "@/components/ui/dashboard-primitives";

interface Props {
  sessions: StudentSessionPerformance[];
  isDark?: boolean;
}

function badgeVariant(pct: number): "success" | "warning" | "error" {
  if (pct >= 80) return "success";
  if (pct >= 60) return "warning";
  return "error";
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "--";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function StudentSessionPerformanceTable({ sessions, isDark = true }: Props) {
  const t = themeTokens(isDark);
  const thCls = `px-5 py-3 font-mono text-[10px] font-medium ${t.textDim} uppercase tracking-[0.25em]`;
  const rowBorder = isDark ? "border-white/[0.06]" : "border-black/[0.06]";
  const rowHover = isDark ? "hover:bg-white/[0.03]" : "hover:bg-black/[0.02]";

  if (sessions.length === 0) {
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
        <p className={`font-mono text-sm ${t.textMid} text-center`}>NO SESSIONS ASSIGNED YET</p>
      </BrutalistCard>
    );
  }

  return (
    <>
      {/* Mobile: stacked card list */}
      <div className="sm:hidden space-y-3">
        {sessions.map((session) => (
          <div
            key={session.session_id}
            className={`relative border ${t.border} ${t.cardBg} p-4`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className={`font-mono text-sm font-medium ${t.text} break-words`}>
                  {session.title ?? "Untitled Session"}
                </div>
                {session.lecture_name && (
                  <div className={`mt-0.5 font-mono text-xs ${t.textDim} break-words`}>
                    {session.lecture_name}
                  </div>
                )}
              </div>
              {session.completed && session.score_percentage !== null ? (
                <BrutalistBadge
                  isDark={isDark}
                  variant={badgeVariant(session.score_percentage)}
                  className="flex-shrink-0"
                >
                  {session.score}/{session.total_questions}
                </BrutalistBadge>
              ) : (
                <BrutalistBadge isDark={isDark} variant="warning" className="flex-shrink-0">
                  PENDING
                </BrutalistBadge>
              )}
            </div>
            <div
              className={`mt-3 pt-3 border-t ${isDark ? "border-white/[0.06]" : "border-black/[0.06]"} flex items-center justify-between font-mono text-xs ${t.textMid}`}
            >
              <span className={t.textDim}>DUE</span>
              <span>{formatDate(session.due_date)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <BrutalistCard isDark={isDark} className="hidden sm:block !p-0 overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className={`border-b ${t.border}`}>
              {["SESSION", "STATUS", "SCORE", "DUE DATE"].map((h) => (
                <th key={h} className={thCls}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sessions.map((session, i) => (
              <tr
                key={session.session_id}
                className={`${i < sessions.length - 1 ? `border-b ${rowBorder}` : ""} transition-colors ${rowHover}`}
              >
                <td className="px-5 py-4">
                  <div className={`font-mono text-sm font-medium ${t.text}`}>
                    {session.title ?? "Untitled Session"}
                  </div>
                  {session.lecture_name && (
                    <div className={`font-mono text-xs ${t.textDim}`}>{session.lecture_name}</div>
                  )}
                </td>
                <td className="px-5 py-4">
                  {session.completed ? (
                    <BrutalistBadge isDark={isDark} variant="success">COMPLETED</BrutalistBadge>
                  ) : (
                    <BrutalistBadge isDark={isDark} variant="warning">PENDING</BrutalistBadge>
                  )}
                </td>
                <td className="px-5 py-4">
                  {session.completed && session.score_percentage !== null ? (
                    <BrutalistBadge
                      isDark={isDark}
                      variant={badgeVariant(session.score_percentage)}
                    >
                      {session.score}/{session.total_questions} · {session.score_percentage}%
                    </BrutalistBadge>
                  ) : (
                    <span className={`font-mono text-sm ${t.textDim}`}>--</span>
                  )}
                </td>
                <td className={`px-5 py-4 font-mono text-sm ${t.textMid}`}>
                  {formatDate(session.due_date)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </BrutalistCard>
    </>
  );
}
