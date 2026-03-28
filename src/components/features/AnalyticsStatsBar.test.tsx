import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import AnalyticsStatsBar from "./AnalyticsStatsBar";
import type { StudentAnalyticsSummary } from "@/lib/types/student-analytics";

function makeSummary(overrides: Partial<StudentAnalyticsSummary> = {}): StudentAnalyticsSummary {
  return {
    total_sessions_completed: 5,
    average_score_percentage: 75,
    best_score_percentage: 90,
    ...overrides,
  };
}

describe("AnalyticsStatsBar", () => {
  it("renders three stat cards", () => {
    render(<AnalyticsStatsBar summary={makeSummary()} />);
    expect(screen.getByText("AVG SCORE")).toBeInTheDocument();
    expect(screen.getByText("SESSIONS DONE")).toBeInTheDocument();
    expect(screen.getByText("BEST SCORE")).toBeInTheDocument();
  });

  it("displays summary values", () => {
    render(<AnalyticsStatsBar summary={makeSummary({ average_score_percentage: 82, total_sessions_completed: 12, best_score_percentage: 95 })} />);
    expect(screen.getByText("82%")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("95%")).toBeInTheDocument();
  });

  it("applies green color for scores >= 80", () => {
    render(<AnalyticsStatsBar summary={makeSummary({ average_score_percentage: 85, best_score_percentage: 100 })} />);
    expect(screen.getByText("85%")).toHaveClass("text-green-400");
    expect(screen.getByText("100%")).toHaveClass("text-green-400");
  });

  it("applies yellow color for scores >= 60 and < 80", () => {
    render(<AnalyticsStatsBar summary={makeSummary({ average_score_percentage: 65, best_score_percentage: 70 })} />);
    expect(screen.getByText("65%")).toHaveClass("text-amber-400");
    expect(screen.getByText("70%")).toHaveClass("text-amber-400");
  });

  it("applies red color for scores < 60", () => {
    render(<AnalyticsStatsBar summary={makeSummary({ average_score_percentage: 40, best_score_percentage: 55 })} />);
    expect(screen.getByText("40%")).toHaveClass("text-red-400");
    expect(screen.getByText("55%")).toHaveClass("text-red-400");
  });

  it("applies green at exactly 80", () => {
    render(<AnalyticsStatsBar summary={makeSummary({ average_score_percentage: 80 })} />);
    expect(screen.getByText("80%")).toHaveClass("text-green-400");
  });

  it("applies yellow at exactly 60", () => {
    render(<AnalyticsStatsBar summary={makeSummary({ average_score_percentage: 60 })} />);
    expect(screen.getByText("60%")).toHaveClass("text-amber-400");
  });
});
