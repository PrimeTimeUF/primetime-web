-- Add lecture grouping fields to course_materials table
ALTER TABLE course_materials
ADD COLUMN lecture_name TEXT,
ADD COLUMN lecture_order INTEGER DEFAULT 0;

-- Create index for lecture grouping
CREATE INDEX idx_course_materials_lecture ON course_materials(course_id, lecture_name, lecture_order);
