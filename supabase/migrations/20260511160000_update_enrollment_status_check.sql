-- Drop existing constraint
ALTER TABLE public.enrollments DROP CONSTRAINT IF EXISTS enrollments_status_check;

-- Add new constraint with the updated values
ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_status_check CHECK (status IN ('active', 'completed', 'dropped', 'reserved', 'cancelled'));
