"use client";

import type { TeacherSessionStats } from "@/lib/types/teacher-analytics";
import { BrutalistCard, BrutalistBadge, themeTokens } from "@/components/ui/dashboard-primitives";

interface TeacherSessionStatsTableProps {
  sessions: TeacherSessionStats[];
  enrolledStudents: number;
  isDark?: boolean;
}

function badgeVariant(pct: number): "success" | "warning" | "error" {
  if (pct >= 80) return "success";
  if (pct >= 60) return "warning";
  return "error";
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "--";
  return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function TeacherSessionStatsTable({ sessions, enrolledStudents, isDark = true }: TeacherSessionStatsTableProps) {
  const t = themeTokens(isDark);
  const thCls = `px-5 py-3 font-mono text-[10px] font-medium ${t.textDim} uppercase tracking-[0.25em]`;
  const rowBorder = isDark ? "border-white/[0.06]" : "border-black/[0.06]";
  const rowHover = isDark ? "hover:bg-white/[0.03]" : "hover:bg-black/[0.02]";

  if (sessions.length === 0) {
    return (
      <BrutalistCard isDark={isDark} className="flex flex-col items-center justify-center py-12 px-6">
        <svg className={`w-12 h-12 ${t.textDim} mb-4`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
          <path d="M9 14l2 2 4-4" />
        </svg>
        <p className={`font-mono text-sm ${t.textMid}`}>NO SESSIONS ASSIGNED YET</p>
      </BrutalistCard>
    );
  }

  return (
    <BrutalistCard isDark={isDark} className="!p-0 overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className={`border-b ${t.border}`}>
            {["SESSION", "COMPLETED", "AVG SCORE", "DUE DATE"].map((h) => (
              <th key={h} className={thCls}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sessions.map((session, i) => (
            <tr key={session.session_id} className={`${i < sessions.length - 1 ? `border-b ${rowBorder}` : ""} transition-colors ${rowHover}`}>
              <td className="px-5 py-4">
                <div className={`font-mono text-sm font-medium ${t.text}`}>{session.title ?? "Untitled Session"}</div>
                {session.lecture_name && <div className={`font-mono text-xs ${t.textDim}`}>{session.lecture_name}</div>}
              </td>
              <td className="px-5 py-4">
                <BrutalistBadge isDark={isDark} variant={badgeVariant(session.completion_rate_percentage)}>
                  {session.completion_count}/{enrolledStudents}
                </BrutalistBadge>
              </td>
              <td className="px-5 py-4">
                <BrutalistBadge isDark={isDark} variant={badgeVariant(session.avg_score_percentage)}>
                  {session.avg_score_percentage}%
                </BrutalistBadge>
              </td>
              <td className={`px-5 py-4 font-mono text-sm ${t.textMid}`}>{formatDate(session.due_date)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </BrutalistCard>
  );
}
