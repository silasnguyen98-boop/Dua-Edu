-- Add project_score to enrollments
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS project_score NUMERIC DEFAULT 0;
