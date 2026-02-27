-- Create session_assignments table
CREATE TABLE session_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES priming_sessions(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  due_date DATE NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  is_published BOOLEAN DEFAULT true,
  UNIQUE(session_id, course_id)
);

-- Enable Row Level Security
ALTER TABLE session_assignments ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_session_assignments_course_id ON session_assignments(course_id);
CREATE INDEX idx_session_assignments_session_id ON session_assignments(session_id);
CREATE INDEX idx_session_assignments_due_date ON session_assignments(due_date);

-- RLS: Teachers can manage assignments for their own courses
CREATE POLICY "Teachers can view own course assignments"
  ON session_assignments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = session_assignments.course_id
      AND courses.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can insert own course assignments"
  ON session_assignments
  FOR INSERT
  WITH CHECK (
    assigned_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = session_assignments.course_id
      AND courses.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update own course assignments"
  ON session_assignments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = session_assignments.course_id
      AND courses.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can delete own course assignments"
  ON session_assignments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = session_assignments.course_id
      AND courses.teacher_id = auth.uid()
    )
  );

-- RLS: Students can view published assignments for enrolled courses
CREATE POLICY "Students can view published assignments for enrolled courses"
  ON session_assignments
  FOR SELECT
  USING (
    is_published = true
    AND EXISTS (
      SELECT 1 FROM course_enrollments
      WHERE course_enrollments.course_id = session_assignments.course_id
      AND course_enrollments.student_id = auth.uid()
    )
  );
