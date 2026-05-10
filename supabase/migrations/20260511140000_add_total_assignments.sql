-- Add total_assignments to classes
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS total_assignments INT4 DEFAULT 0;
