-- Allow enrolled students to read the profile of teachers who teach their courses
CREATE POLICY "Students can read teacher profiles"
  ON public.users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM course_enrollments ce
      JOIN courses c ON c.id = ce.course_id
      WHERE ce.student_id = auth.uid()
        AND c.teacher_id = users.id
    )
  );
