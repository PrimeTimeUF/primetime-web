import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Student Dashboard",
};

export default function StudentDashboardPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-black">
            Welcome to PrimeTime
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Your upcoming priming sessions
          </p>
        </div>
      </div>

      {/* Placeholder — session cards will go here */}
      <p className="text-sm text-gray-400">No sessions available yet.</p>
    </div>
  );
}
