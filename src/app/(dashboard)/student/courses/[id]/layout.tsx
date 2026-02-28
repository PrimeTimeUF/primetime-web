import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Course Detail",
};

export default function StudentCourseLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
