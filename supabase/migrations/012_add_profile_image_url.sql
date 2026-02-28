-- Add profile_image_url column to users table
ALTER TABLE public.users
ADD COLUMN profile_image_url TEXT;

-- Add comment to document the column
COMMENT ON COLUMN public.users.profile_image_url IS 'URL to the user''s profile image stored in Supabase Storage';
