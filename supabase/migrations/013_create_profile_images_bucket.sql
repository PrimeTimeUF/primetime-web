-- Create storage bucket for profile images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-images',
  'profile-images',
  true, -- Publicly accessible for viewing
  5242880, -- 5MB file size limit
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
);

-- Policy: Users can upload their own profile image
CREATE POLICY "Users can upload own profile image"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Anyone can view profile images (since bucket is public)
CREATE POLICY "Anyone can view profile images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'profile-images');

-- Policy: Users can update their own profile image
CREATE POLICY "Users can update own profile image"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'profile-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can delete their own profile image
CREATE POLICY "Users can delete own profile image"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'profile-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
