export interface SessionAssignment {
  id: string;
  session_id: string;
  course_id: string;
  assigned_by: string;
  due_date: string;
  assigned_at: string;
  is_published: boolean;
}

export interface SessionAssignmentWithSession extends SessionAssignment {
  session: {
    id: string;
    title: string | null;
    lecture_name: string | null;
    duration: 10 | 15 | 30 | null;
    status: "generating" | "completed" | "failed";
  };
}

export interface StudentAssignmentView extends SessionAssignmentWithSession {
  completion: {
    score: number;
    total_questions: number;
    completed_at: string;
  } | null;
}
