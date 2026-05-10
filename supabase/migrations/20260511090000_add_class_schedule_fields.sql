alter table public.classes
add column if not exists start_date date,
add column if not exists total_sessions int4;
