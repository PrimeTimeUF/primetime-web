-- Add audio tracking columns to priming_sessions
ALTER TABLE priming_sessions
  ADD COLUMN audio_url TEXT,
  ADD COLUMN audio_status TEXT DEFAULT 'none' CHECK (audio_status IN ('none', 'generating', 'ready', 'failed'));

-- Index for quick audio status lookups
CREATE INDEX idx_priming_sessions_audio_status ON priming_sessions(audio_status);
