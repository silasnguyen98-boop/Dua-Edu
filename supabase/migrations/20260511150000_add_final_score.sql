-- Add final_score to enrollments
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS final_score NUMERIC DEFAULT 0;
