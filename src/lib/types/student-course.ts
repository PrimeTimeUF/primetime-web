export interface StudentCourseDetail {
  id: string;
  title: string;
  description: string | null;
  course_code: string;
  semester: string;
  teacher_name: string;
  teacher_profile_image_url: string | null;
}

export interface StudentCourseProgress {
  total_assigned: number;
  completed_count: number;
  completion_percentage: number;
  average_score: number;
}
