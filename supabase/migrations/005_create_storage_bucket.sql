-- Create storage bucket for course materials
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-materials',
  'course-materials',
  false, -- Not publicly accessible by default
  26214400, -- 25MB file size limit
  ARRAY[
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif',
    'video/mp4',
    'video/quicktime'
  ]
);

-- Policy: Teachers can upload files to their own course folders
CREATE POLICY "Teachers can upload course materials"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'course-materials'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id::text = (storage.foldername(name))[1]
      AND courses.teacher_id = auth.uid()
    )
  );

-- Policy: Teachers can view files in their own course folders
CREATE POLICY "Teachers can view own course materials"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'course-materials'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id::text = (storage.foldername(name))[1]
      AND courses.teacher_id = auth.uid()
    )
  );

-- Policy: Students can view files in courses they're enrolled in
CREATE POLICY "Students can view enrolled course materials"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'course-materials'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM course_enrollments
      JOIN courses ON courses.id = course_enrollments.course_id
      WHERE courses.id::text = (storage.foldername(name))[1]
      AND course_enrollments.student_id = auth.uid()
    )
  );

-- Policy: Teachers can delete files from their own course folders
CREATE POLICY "Teachers can delete own course materials"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'course-materials'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id::text = (storage.foldername(name))[1]
      AND courses.teacher_id = auth.uid()
    )
  );

-- Policy: Teachers can update files in their own course folders
CREATE POLICY "Teachers can update own course materials"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'course-materials'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id::text = (storage.foldername(name))[1]
      AND courses.teacher_id = auth.uid()
    )
  );
