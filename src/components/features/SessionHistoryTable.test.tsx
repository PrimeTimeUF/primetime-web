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
    expect(screen.getByText("No sessions completed yet")).toBeInTheDocument();
  });

  it("does not render a table when results is empty", () => {
    render(<SessionHistoryTable results={[]} />);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("renders a table with column headers", () => {
    render(<SessionHistoryTable results={[makeResult()]} />);
    expect(screen.getByText("Session")).toBeInTheDocument();
    expect(screen.getByText("Score")).toBeInTheDocument();
    expect(screen.getByText("Date")).toBeInTheDocument();
  });

  it("displays session title and course code", () => {
    render(<SessionHistoryTable results={[makeResult()]} />);
    expect(screen.getByText("Lecture 1 Review")).toBeInTheDocument();
    expect(screen.getByText("BIO101")).toBeInTheDocument();
  });

  it("shows 'Untitled Session' when title is null", () => {
    render(<SessionHistoryTable results={[makeResult({ session: { title: null, lecture_name: "L1" } })]} />);
    expect(screen.getByText("Untitled Session")).toBeInTheDocument();
  });

  it("displays score as fraction", () => {
    render(<SessionHistoryTable results={[makeResult({ score: 3, total_questions: 4 })]} />);
    expect(screen.getByText("3/4")).toBeInTheDocument();
  });

  it("applies green badge for score >= 80%", () => {
    render(<SessionHistoryTable results={[makeResult({ score: 4, total_questions: 5 })]} />);
    const badge = screen.getByText("4/5");
    expect(badge).toHaveClass("bg-green-50", "text-green-700");
  });

  it("applies yellow badge for score >= 60% and < 80%", () => {
    render(<SessionHistoryTable results={[makeResult({ score: 3, total_questions: 5 })]} />);
    const badge = screen.getByText("3/5");
    expect(badge).toHaveClass("bg-yellow-50", "text-yellow-700");
  });

  it("applies red badge for score < 60%", () => {
    render(<SessionHistoryTable results={[makeResult({ score: 1, total_questions: 5 })]} />);
    const badge = screen.getByText("1/5");
    expect(badge).toHaveClass("bg-red-50", "text-red-700");
  });

  it("formats date correctly", () => {
    render(<SessionHistoryTable results={[makeResult({ completed_at: "2025-01-15T10:00:00Z" })]} />);
    expect(screen.getByText("Jan 15, 2025")).toBeInTheDocument();
  });

  it("renders multiple rows", () => {
    const results = [
      makeResult({ id: "r1", session: { title: "Session A", lecture_name: "L1" } }),
      makeResult({ id: "r2", session: { title: "Session B", lecture_name: "L2" } }),
    ];
    render(<SessionHistoryTable results={results} />);
    expect(screen.getByText("Session A")).toBeInTheDocument();
    expect(screen.getByText("Session B")).toBeInTheDocument();
  });
});
