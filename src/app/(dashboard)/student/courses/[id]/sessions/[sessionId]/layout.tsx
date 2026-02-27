import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Priming Session",
};

export default function StudentSessionLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
