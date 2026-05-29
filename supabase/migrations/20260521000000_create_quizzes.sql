-- Quiz cho từng buổi học. Học viên vắng buổi có thể làm quiz để chuyển trạng thái
-- absent -> excused (đạt ngưỡng pass_threshold). Học viên có mặt cũng làm được
-- nhưng không đổi trạng thái.

-- Đảm bảo trigger function tồn tại (idempotent, dùng chung với các bảng khác).
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    session_number INT NOT NULL CHECK (session_number >= 0),
    title TEXT NOT NULL,
    description TEXT,
    open_at TIMESTAMPTZ,
    close_at TIMESTAMPTZ,
    time_limit_minutes INT NOT NULL DEFAULT 15 CHECK (time_limit_minutes >= 0),
    pass_threshold NUMERIC(3, 2) NOT NULL DEFAULT 0.40
        CHECK (pass_threshold >= 0 AND pass_threshold <= 1),
    shuffle_questions BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (class_id, session_number)
);

CREATE INDEX IF NOT EXISTS quizzes_class_id_idx
    ON public.quizzes (class_id, session_number);


CREATE TABLE IF NOT EXISTS public.quiz_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    order_index INT NOT NULL DEFAULT 0,
    content TEXT NOT NULL,
    options JSONB NOT NULL DEFAULT '[]'::jsonb,
    correct_indices INT[] NOT NULL DEFAULT '{}',
    explanation TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quiz_items_quiz_id_idx
    ON public.quiz_items (quiz_id, order_index);


CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    correct_count INT NOT NULL DEFAULT 0,
    total_count INT NOT NULL DEFAULT 0,
    score NUMERIC(4, 3) NOT NULL DEFAULT 0,
    passed BOOLEAN NOT NULL DEFAULT false,
    was_absent BOOLEAN NOT NULL DEFAULT false,
    status_changed BOOLEAN NOT NULL DEFAULT false,
    started_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (quiz_id, student_id)
);

CREATE INDEX IF NOT EXISTS quiz_attempts_student_idx
    ON public.quiz_attempts (student_id);
CREATE INDEX IF NOT EXISTS quiz_attempts_enrollment_idx
    ON public.quiz_attempts (enrollment_id);


DROP TRIGGER IF EXISTS quizzes_set_updated_at ON public.quizzes;
CREATE TRIGGER quizzes_set_updated_at
    BEFORE UPDATE ON public.quizzes
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS quiz_items_set_updated_at ON public.quiz_items;
CREATE TRIGGER quiz_items_set_updated_at
    BEFORE UPDATE ON public.quiz_items
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Enable all operations on quizzes" ON public.quizzes;
    DROP POLICY IF EXISTS "Enable all operations on quiz_items" ON public.quiz_items;
    DROP POLICY IF EXISTS "Enable all operations on quiz_attempts" ON public.quiz_attempts;
EXCEPTION
    WHEN undefined_object THEN
        NULL;
END $$;

CREATE POLICY "Enable all operations on quizzes"
ON public.quizzes
FOR ALL
TO authenticated, anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable all operations on quiz_items"
ON public.quiz_items
FOR ALL
TO authenticated, anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable all operations on quiz_attempts"
ON public.quiz_attempts
FOR ALL
TO authenticated, anon
USING (true)
WITH CHECK (true);
