"use client";

import type { StudentSessionResult } from "@/lib/types/student-analytics";

interface SessionHistoryTableProps {
  results: StudentSessionResult[];
}

function scoreBadgeClasses(score: number, total: number): string {
  const pct = (score / total) * 100;
  if (pct >= 80) return "bg-green-50 text-green-700";
  if (pct >= 60) return "bg-yellow-50 text-yellow-700";
  return "bg-red-50 text-red-700";
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function SessionHistoryTable({ results }: SessionHistoryTableProps) {
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 bg-white border border-gray-200 rounded-xl">
        <svg
          className="w-12 h-12 text-gray-300 mb-4"
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
        <p className="text-sm text-gray-500">No sessions completed yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Session
            </th>
            <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Score
            </th>
            <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {results.map((result) => (
            <tr key={result.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-5 py-4">
                <div className="text-sm font-medium text-black">
                  {result.session.title ?? "Untitled Session"}
                </div>
                <div className="text-xs text-gray-500">
                  {result.course.course_code}
                </div>
              </td>
              <td className="px-5 py-4">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${scoreBadgeClasses(result.score, result.total_questions)}`}
                >
                  {result.score}/{result.total_questions}
                </span>
              </td>
              <td className="px-5 py-4 text-sm text-gray-500">
                {formatDate(result.completed_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
