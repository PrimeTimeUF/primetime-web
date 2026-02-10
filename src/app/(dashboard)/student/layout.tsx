import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Student Dashboard - PrimeTime",
  description: "Manage your priming sessions and course enrollments",
};

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
