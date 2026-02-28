-- Create student_session_results table
CREATE TABLE student_session_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES priming_sessions(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE student_session_results ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_student_session_results_student_id ON student_session_results(student_id);
CREATE INDEX idx_student_session_results_session_id ON student_session_results(session_id);
CREATE INDEX idx_student_session_results_course_id ON student_session_results(course_id);

-- RLS: Students can view their own results
CREATE POLICY "Students can view own results"
  ON student_session_results
  FOR SELECT
  USING (student_id = auth.uid());

-- RLS: Students can insert their own results
CREATE POLICY "Students can insert own results"
  ON student_session_results
  FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- RLS: Teachers can view results for their courses
CREATE POLICY "Teachers can view results for own courses"
  ON student_session_results
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = student_session_results.course_id
      AND courses.teacher_id = auth.uid()
    )
  );
