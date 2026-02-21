export interface PrimingSessionContent {
  introduction: {
    title: string;
    paragraphs: string[];
  };
  keyTerms: {
    term: string;
    definition: string;
  }[];
  coreConcepts: {
    title: string;
    explanation: string;
  }[];
  lecturePreview: {
    title: string;
    paragraphs: string[];
  };
}

export interface SessionQuestion {
  id: string;
  session_id: string;
  question_number: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: "a" | "b" | "c" | "d";
  explanation: string | null;
  created_at: string;
}

export interface PrimingSession {
  id: string;
  material_id: string | null;
  course_id: string;
  title: string | null;
  status: "generating" | "completed" | "failed";
  content: PrimingSessionContent | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
  lecture_name: string | null;
  duration: 10 | 15 | 30 | null;
}

export interface PrimingSessionWithQuestions extends PrimingSession {
  questions: SessionQuestion[];
}

export interface PrimingSessionListItem {
  id: string;
  material_id: string | null;
  course_id: string;
  title: string | null;
  status: "generating" | "completed" | "failed";
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
  lecture_name: string | null;
  duration: 10 | 15 | 30 | null;
  material: {
    file_name: string;
  } | null;
}
