import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Courses",
};

export default function TeacherDashboardPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-black">
            Your Courses
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and organize your course materials
          </p>
        </div>
      </div>

      {/* Placeholder — course cards will go here */}
      <p className="text-sm text-gray-400">No courses yet.</p>
    </div>
  );
}
