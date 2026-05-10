CREATE TABLE IF NOT EXISTS public.class_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    session_number INT NOT NULL,
    session_title TEXT NOT NULL,
    session_date DATE,
    start_time TIME,
    end_time TIME,
    meeting_url TEXT,
    recording_url TEXT,
    note TEXT,
    status TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(class_id, session_number)
);

ALTER TABLE public.class_sessions ENABLE ROW LEVEL SECURITY;

-- Safely drop the policy if it exists to replace it
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Enable all operations for authenticated users on class_sessions" ON public.class_sessions;
EXCEPTION
    WHEN undefined_object THEN
        NULL;
END $$;

CREATE POLICY "Enable all operations for authenticated users on class_sessions"
ON public.class_sessions
FOR ALL
TO authenticated, anon
USING (true)
WITH CHECK (true);
