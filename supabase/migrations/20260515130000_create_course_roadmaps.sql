-- Course roadmaps: per-course learning paths with ordered steps.

CREATE TABLE IF NOT EXISTS public.course_roadmaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    version INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (course_id, version)
);

CREATE INDEX IF NOT EXISTS course_roadmaps_course_id_idx
    ON public.course_roadmaps (course_id);

-- Only one active roadmap per course.
CREATE UNIQUE INDEX IF NOT EXISTS course_roadmaps_one_active_per_course_idx
    ON public.course_roadmaps (course_id)
    WHERE is_active;


CREATE TABLE IF NOT EXISTS public.roadmap_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    roadmap_id UUID NOT NULL REFERENCES public.course_roadmaps(id) ON DELETE CASCADE,
    parent_step_id UUID REFERENCES public.roadmap_steps(id) ON DELETE CASCADE,
    order_index INT NOT NULL DEFAULT 0,
    step_type TEXT NOT NULL DEFAULT 'lesson'
        CHECK (step_type IN ('module', 'lesson', 'assignment', 'milestone')),
    title TEXT NOT NULL,
    description TEXT,
    prerequisites UUID[] NOT NULL DEFAULT '{}',
    resource_url TEXT,
    assignment_id UUID,
    estimated_hours NUMERIC(6, 2),
    duration_days INT,
    due_offset_days INT,
    is_required BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS roadmap_steps_roadmap_id_idx
    ON public.roadmap_steps (roadmap_id, order_index);

CREATE INDEX IF NOT EXISTS roadmap_steps_parent_step_id_idx
    ON public.roadmap_steps (parent_step_id);


-- Trigger to keep updated_at fresh.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS course_roadmaps_set_updated_at ON public.course_roadmaps;
CREATE TRIGGER course_roadmaps_set_updated_at
    BEFORE UPDATE ON public.course_roadmaps
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS roadmap_steps_set_updated_at ON public.roadmap_steps;
CREATE TRIGGER roadmap_steps_set_updated_at
    BEFORE UPDATE ON public.roadmap_steps
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- RLS — follow repo pattern (authenticated + anon full access, e.g. class_sessions).
ALTER TABLE public.course_roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_steps ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Enable all operations for authenticated users on course_roadmaps" ON public.course_roadmaps;
    DROP POLICY IF EXISTS "Enable all operations for authenticated users on roadmap_steps" ON public.roadmap_steps;
EXCEPTION
    WHEN undefined_object THEN
        NULL;
END $$;

CREATE POLICY "Enable all operations for authenticated users on course_roadmaps"
ON public.course_roadmaps
FOR ALL
TO authenticated, anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users on roadmap_steps"
ON public.roadmap_steps
FOR ALL
TO authenticated, anon
USING (true)
WITH CHECK (true);
