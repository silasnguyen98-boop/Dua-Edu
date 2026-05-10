ALTER TABLE public.class_sessions ADD COLUMN IF NOT EXISTS slide_url TEXT;
ALTER TABLE public.class_sessions ADD COLUMN IF NOT EXISTS reference_url TEXT;
ALTER TABLE public.class_sessions ADD COLUMN IF NOT EXISTS assignment_url TEXT;
