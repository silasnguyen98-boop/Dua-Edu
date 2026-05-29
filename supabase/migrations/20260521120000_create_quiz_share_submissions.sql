-- Log mọi lượt nộp quiz qua share link (chỉ khi có nhập email).
-- Khác với quiz_attempts (chỉ lưu học viên matched + ảnh hưởng điểm chuyên cần),
-- bảng này lưu cả email không matched để admin tra cứu.

CREATE TABLE IF NOT EXISTS public.quiz_share_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    matched_student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
    matched_enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE SET NULL,
    correct_count INT NOT NULL DEFAULT 0,
    total_count INT NOT NULL DEFAULT 0,
    score NUMERIC(4, 3) NOT NULL DEFAULT 0,
    passed BOOLEAN NOT NULL DEFAULT false,
    status_changed BOOLEAN NOT NULL DEFAULT false,
    match_reason TEXT NOT NULL,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    started_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quiz_share_submissions_quiz_idx
    ON public.quiz_share_submissions (quiz_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS quiz_share_submissions_email_idx
    ON public.quiz_share_submissions (email);

ALTER TABLE public.quiz_share_submissions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Enable all operations on quiz_share_submissions" ON public.quiz_share_submissions;
EXCEPTION
    WHEN undefined_object THEN
        NULL;
END $$;

CREATE POLICY "Enable all operations on quiz_share_submissions"
ON public.quiz_share_submissions
FOR ALL
TO authenticated, anon
USING (true)
WITH CHECK (true);
