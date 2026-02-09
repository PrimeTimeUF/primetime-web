-- Create session_completions table, tracks when students complete priming sessions and their chosen duration
CREATE TABLE session_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  duration_choice INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Prevent duplicate completions for the same student + session
CREATE UNIQUE INDEX idx_session_completions_student_session
  ON session_completions (student_id, session_id);

-- Fast lookups by session
CREATE INDEX idx_session_completions_session_id
  ON session_completions (session_id);
