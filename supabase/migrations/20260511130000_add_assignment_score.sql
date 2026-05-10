-- Add assignment_score to enrollments
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS assignment_score NUMERIC DEFAULT 0;
