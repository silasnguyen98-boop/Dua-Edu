alter table public.classes
  add column if not exists schedule text,
  add column if not exists study_time text;
