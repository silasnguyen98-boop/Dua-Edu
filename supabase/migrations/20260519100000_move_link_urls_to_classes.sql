-- Move per-session resource links to the class level.
-- meeting_url, recording_url, slide_url, reference_url, assignment_url now live on classes.

ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS meeting_url TEXT;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS recording_url TEXT;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS slide_url TEXT;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS reference_url TEXT;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS assignment_url TEXT;

-- Backfill class-level URLs from existing session data.
-- For each class, take the first non-null value across its sessions (ordered by session_number).
UPDATE public.classes c
SET
  meeting_url    = COALESCE(c.meeting_url,    sub.meeting_url),
  recording_url  = COALESCE(c.recording_url,  sub.recording_url),
  slide_url      = COALESCE(c.slide_url,      sub.slide_url),
  reference_url  = COALESCE(c.reference_url,  sub.reference_url),
  assignment_url = COALESCE(c.assignment_url, sub.assignment_url)
FROM (
  SELECT
    class_id,
    (ARRAY_AGG(meeting_url    ORDER BY session_number) FILTER (WHERE meeting_url    IS NOT NULL))[1] AS meeting_url,
    (ARRAY_AGG(recording_url  ORDER BY session_number) FILTER (WHERE recording_url  IS NOT NULL))[1] AS recording_url,
    (ARRAY_AGG(slide_url      ORDER BY session_number) FILTER (WHERE slide_url      IS NOT NULL))[1] AS slide_url,
    (ARRAY_AGG(reference_url  ORDER BY session_number) FILTER (WHERE reference_url  IS NOT NULL))[1] AS reference_url,
    (ARRAY_AGG(assignment_url ORDER BY session_number) FILTER (WHERE assignment_url IS NOT NULL))[1] AS assignment_url
  FROM public.class_sessions
  WHERE class_id IS NOT NULL
  GROUP BY class_id
) sub
WHERE c.id = sub.class_id;

ALTER TABLE public.class_sessions DROP COLUMN IF EXISTS meeting_url;
ALTER TABLE public.class_sessions DROP COLUMN IF EXISTS recording_url;
ALTER TABLE public.class_sessions DROP COLUMN IF EXISTS slide_url;
ALTER TABLE public.class_sessions DROP COLUMN IF EXISTS reference_url;
ALTER TABLE public.class_sessions DROP COLUMN IF EXISTS assignment_url;
