-- Create public storage bucket for session audio files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'session-audio',
  'session-audio',
  true,
  10485760,
  ARRAY['audio/mpeg']
);

-- Allow authenticated users (teachers) to upload audio
CREATE POLICY "Teachers can upload session audio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'session-audio'
  AND EXISTS (
    SELECT 1 FROM priming_sessions ps
    JOIN courses c ON c.id = ps.course_id
    WHERE ps.id::text = split_part(name, '.', 1)
    AND c.teacher_id = auth.uid()
  )
);

-- Allow public read of audio files (students stream without auth overhead)
CREATE POLICY "Public can read session audio"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'session-audio');
