import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import SessionHistoryTable from "./SessionHistoryTable";
import type { StudentSessionResult } from "@/lib/types/student-analytics";

function makeResult(overrides: Partial<StudentSessionResult> = {}): StudentSessionResult {
  return {
    id: "result-1",
    student_id: "student-1",
    session_id: "session-1",
    course_id: "course-1",
    score: 4,
    total_questions: 5,
    completed_at: "2025-06-15T10:00:00Z",
    session: { title: "Lecture 1 Review", lecture_name: "Lecture 1" },
    course: { title: "Biology 101", course_code: "BIO101" },
    ...overrides,
  };
}

describe("SessionHistoryTable", () => {
  it("renders empty state when results is empty", () => {
    render(<SessionHistoryTable results={[]} />);
    expect(screen.getByText("NO SESSIONS COMPLETED YET")).toBeInTheDocument();
  });

  it("does not render a table when results is empty", () => {
    render(<SessionHistoryTable results={[]} />);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("renders a table with column headers", () => {
    render(<SessionHistoryTable results={[makeResult()]} />);
    expect(screen.getByText("SESSION")).toBeInTheDocument();
    expect(screen.getByText("SCORE")).toBeInTheDocument();
    expect(screen.getByText("DATE")).toBeInTheDocument();
  });

  it("displays session title and course code", () => {
    render(<SessionHistoryTable results={[makeResult()]} />);
    expect(screen.getAllByText("Lecture 1 Review").length).toBeGreaterThan(0);
    expect(screen.getAllByText("BIO101").length).toBeGreaterThan(0);
  });

  it("shows 'Untitled Session' when title is null", () => {
    render(<SessionHistoryTable results={[makeResult({ session: { title: null, lecture_name: "L1" } })]} />);
    expect(screen.getAllByText("Untitled Session").length).toBeGreaterThan(0);
  });

  it("displays score as fraction", () => {
    render(<SessionHistoryTable results={[makeResult({ score: 3, total_questions: 4 })]} />);
    expect(screen.getAllByText("3/4").length).toBeGreaterThan(0);
  });

  it("applies success badge for score >= 80%", () => {
    render(<SessionHistoryTable results={[makeResult({ score: 4, total_questions: 5 })]} />);
    const badges = screen.getAllByText("4/5");
    badges.forEach((badge) => expect(badge).toHaveClass("text-green-400"));
  });

  it("applies warning badge for score >= 60% and < 80%", () => {
    render(<SessionHistoryTable results={[makeResult({ score: 3, total_questions: 5 })]} />);
    const badges = screen.getAllByText("3/5");
    badges.forEach((badge) => expect(badge).toHaveClass("text-amber-400"));
  });

  it("applies error badge for score < 60%", () => {
    render(<SessionHistoryTable results={[makeResult({ score: 1, total_questions: 5 })]} />);
    const badges = screen.getAllByText("1/5");
    badges.forEach((badge) => expect(badge).toHaveClass("text-red-400"));
  });

  it("formats date correctly", () => {
    render(<SessionHistoryTable results={[makeResult({ completed_at: "2025-01-15T10:00:00Z" })]} />);
    expect(screen.getAllByText("Jan 15, 2025").length).toBeGreaterThan(0);
  });

  it("renders multiple rows", () => {
    const results = [
      makeResult({ id: "r1", session: { title: "Session A", lecture_name: "L1" } }),
      makeResult({ id: "r2", session: { title: "Session B", lecture_name: "L2" } }),
    ];
    render(<SessionHistoryTable results={results} />);
    expect(screen.getAllByText("Session A").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Session B").length).toBeGreaterThan(0);
  });
});
