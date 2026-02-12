-- Create priming_sessions table
CREATE TABLE priming_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id UUID NOT NULL REFERENCES course_materials(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT,
  status TEXT NOT NULL DEFAULT 'generating' CHECK (status IN ('generating', 'completed', 'failed')),
  content JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Create session_questions table
CREATE TABLE session_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES priming_sessions(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL CHECK (correct_answer IN ('a', 'b', 'c', 'd')),
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE priming_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_questions ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_priming_sessions_material_id ON priming_sessions(material_id);
CREATE INDEX idx_priming_sessions_course_id ON priming_sessions(course_id);
CREATE INDEX idx_priming_sessions_status ON priming_sessions(status);
CREATE INDEX idx_session_questions_session_id ON session_questions(session_id);

-- RLS: Teachers can view sessions for their own courses
CREATE POLICY "Teachers can view own course sessions"
  ON priming_sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = priming_sessions.course_id
      AND courses.teacher_id = auth.uid()
    )
  );

-- RLS: Students can view completed sessions for courses they're enrolled in
CREATE POLICY "Students can view enrolled course sessions"
  ON priming_sessions
  FOR SELECT
  USING (
    status = 'completed'
    AND EXISTS (
      SELECT 1 FROM course_enrollments
      WHERE course_enrollments.course_id = priming_sessions.course_id
      AND course_enrollments.student_id = auth.uid()
    )
  );

-- RLS: Teachers can view questions for their own course sessions
CREATE POLICY "Teachers can view own course session questions"
  ON session_questions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM priming_sessions
      JOIN courses ON courses.id = priming_sessions.course_id
      WHERE priming_sessions.id = session_questions.session_id
      AND courses.teacher_id = auth.uid()
    )
  );

-- RLS: Students can view questions for completed sessions in enrolled courses
CREATE POLICY "Students can view enrolled course session questions"
  ON session_questions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM priming_sessions
      JOIN course_enrollments ON course_enrollments.course_id = priming_sessions.course_id
      WHERE priming_sessions.id = session_questions.session_id
      AND priming_sessions.status = 'completed'
      AND course_enrollments.student_id = auth.uid()
    )
  );
