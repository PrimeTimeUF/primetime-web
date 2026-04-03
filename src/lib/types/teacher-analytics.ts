export interface TeacherCourseAnalyticsSummary {
  course_id: string;
  title: string;
  course_code: string;
  enrolled_students: number;
  sessions_assigned: number;
  avg_score_percentage: number;
  completion_rate_percentage: number;
}

export interface TeacherAnalyticsOverview {
  total_students: number;
  total_sessions_assigned: number;
  overall_avg_score: number;
  overall_completion_rate: number;
  courses: TeacherCourseAnalyticsSummary[];
}

export interface TeacherSessionStats {
  session_id: string;
  title: string | null;
  lecture_name: string | null;
  assigned_at: string;
  due_date: string | null;
  completion_count: number;
  completion_rate_percentage: number;
  avg_score_percentage: number;
}

export interface TeacherStudentStats {
  student_id: string;
  full_name: string;
  sessions_completed: number;
  avg_score_percentage: number;
  best_score_percentage: number;
}

export interface TeacherCourseAnalyticsDetail {
  course_id: string;
  title: string;
  course_code: string;
  enrolled_students: number;
  sessions_assigned: number;
  avg_score_percentage: number;
  completion_rate_percentage: number;
  sessions: TeacherSessionStats[];
  students: TeacherStudentStats[];
}
