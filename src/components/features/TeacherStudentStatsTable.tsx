"use client";

import type { TeacherStudentStats } from "@/lib/types/teacher-analytics";
import { BrutalistCard, BrutalistBadge, themeTokens } from "@/components/ui/dashboard-primitives";

interface TeacherStudentStatsTableProps {
  students: TeacherStudentStats[];
  isDark?: boolean;
}

function badgeVariant(pct: number): "success" | "warning" | "error" {
  if (pct >= 80) return "success";
  if (pct >= 60) return "warning";
  return "error";
}

function ScoreBadge({ pct, isDark, hasData }: { pct: number; isDark: boolean; hasData: boolean }) {
  const t = themeTokens(isDark);
  if (!hasData) return <span className={`font-mono text-sm ${t.textDim}`}>--</span>;
  return <BrutalistBadge isDark={isDark} variant={badgeVariant(pct)}>{pct}%</BrutalistBadge>;
}

export default function TeacherStudentStatsTable({ students, isDark = true }: TeacherStudentStatsTableProps) {
  const t = themeTokens(isDark);
  const thCls = `px-5 py-3 font-mono text-[10px] font-medium ${t.textDim} uppercase tracking-[0.25em]`;
  const rowBorder = isDark ? "border-white/[0.06]" : "border-black/[0.06]";
  const rowHover = isDark ? "hover:bg-white/[0.03]" : "hover:bg-black/[0.02]";

  if (students.length === 0) {
    return (
      <BrutalistCard isDark={isDark} className="flex flex-col items-center justify-center py-12 px-6">
        <svg className={`w-12 h-12 ${t.textDim} mb-4`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        <p className={`font-mono text-sm ${t.textMid}`}>NO STUDENTS ENROLLED YET</p>
      </BrutalistCard>
    );
  }

  return (
    <BrutalistCard isDark={isDark} className="!p-0 overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className={`border-b ${t.border}`}>
            {["STUDENT", "COMPLETED", "AVG SCORE", "BEST SCORE"].map((h) => (
              <th key={h} className={thCls}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {students.map((student, i) => (
            <tr key={student.student_id} className={`${i < students.length - 1 ? `border-b ${rowBorder}` : ""} transition-colors ${rowHover}`}>
              <td className={`px-5 py-4 font-mono text-sm font-medium ${t.text}`}>{student.full_name}</td>
              <td className={`px-5 py-4 font-mono text-sm ${t.textMid}`}>{student.sessions_completed}</td>
              <td className="px-5 py-4"><ScoreBadge pct={student.avg_score_percentage} isDark={isDark} hasData={student.sessions_completed > 0} /></td>
              <td className="px-5 py-4"><ScoreBadge pct={student.best_score_percentage} isDark={isDark} hasData={student.sessions_completed > 0} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </BrutalistCard>
  );
}
