-- Add lecture_name and duration columns to priming_sessions
-- Sessions now map to a lecture group rather than a single material
ALTER TABLE priming_sessions
  ADD COLUMN lecture_name TEXT,
  ADD COLUMN duration INTEGER CHECK (duration IN (10, 15, 30));

-- Make material_id nullable (sessions created from lecture groups don't have a single material)
ALTER TABLE priming_sessions
  ALTER COLUMN material_id DROP NOT NULL;
