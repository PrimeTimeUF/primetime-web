export interface StudentSessionResult {
  id: string;
  student_id: string;
  session_id: string;
  course_id: string;
  score: number;
  total_questions: number;
  completed_at: string;
  session: {
    title: string | null;
    lecture_name: string | null;
  };
  course: {
    title: string;
    course_code: string;
  };
}

export interface StudentAnalyticsSummary {
  total_sessions_completed: number;
  average_score_percentage: number;
  best_score_percentage: number;
}

export interface StudentAnalytics {
  results: StudentSessionResult[];
  summary: StudentAnalyticsSummary;
}
