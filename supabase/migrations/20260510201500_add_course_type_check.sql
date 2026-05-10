alter table public.courses
drop constraint if exists courses_course_type_check;

alter table public.courses
add constraint courses_course_type_check
check (course_type = any (array['offline'::text, 'online'::text, 'elearning'::text, 'self_study'::text]));
