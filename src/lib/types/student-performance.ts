export interface StudentCoursePerformanceSummary {
  course_id: string;
  title: string;
  course_code: string;
  semester: string | null;
  sessions_assigned: number;
  sessions_completed: number;
  completion_rate_percentage: number;
  avg_score_percentage: number;
  best_score_percentage: number;
}

export interface StudentPerformanceOverview {
  total_courses: number;
  total_sessions_assigned: number;
  total_sessions_completed: number;
  overall_avg_score: number;
  overall_best_score: number;
  overall_completion_rate: number;
  courses: StudentCoursePerformanceSummary[];
}

export interface StudentSessionPerformance {
  session_id: string;
  title: string | null;
  lecture_name: string | null;
  assigned_at: string;
  due_date: string | null;
  completed: boolean;
  completed_at: string | null;
  score: number | null;
  total_questions: number | null;
  score_percentage: number | null;
}

export interface StudentCoursePerformanceDetail {
  course_id: string;
  title: string;
  course_code: string;
  semester: string | null;
  sessions_assigned: number;
  sessions_completed: number;
  completion_rate_percentage: number;
  avg_score_percentage: number;
  best_score_percentage: number;
  sessions: StudentSessionPerformance[];
}
