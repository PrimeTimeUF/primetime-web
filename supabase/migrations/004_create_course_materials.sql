-- Create course_materials table
CREATE TABLE course_materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE course_materials ENABLE ROW LEVEL SECURITY;

-- Policy: Teachers can view materials for their own courses
CREATE POLICY "Teachers can view own course materials"
  ON course_materials
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_materials.course_id
      AND courses.teacher_id = auth.uid()
    )
  );

-- Policy: Students can view materials for courses they're enrolled in
CREATE POLICY "Students can view enrolled course materials"
  ON course_materials
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM course_enrollments
      WHERE course_enrollments.course_id = course_materials.course_id
      AND course_enrollments.student_id = auth.uid()
    )
  );

-- Policy: Teachers can insert materials for their own courses
CREATE POLICY "Teachers can upload to own courses"
  ON course_materials
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_materials.course_id
      AND courses.teacher_id = auth.uid()
    )
  );

-- Policy: Teachers can delete materials from their own courses
CREATE POLICY "Teachers can delete own course materials"
  ON course_materials
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_materials.course_id
      AND courses.teacher_id = auth.uid()
    )
  );

-- Create index for faster course_id lookups
CREATE INDEX idx_course_materials_course_id ON course_materials(course_id);

-- Create index for faster uploaded_at sorting
CREATE INDEX idx_course_materials_uploaded_at ON course_materials(uploaded_at DESC);
