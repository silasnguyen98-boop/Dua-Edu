create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  session_number int not null check (session_number > 0),
  status text not null default 'present' check (status = any (array['present'::text, 'absent'::text, 'late'::text, 'excused'::text])),
  attendance_point numeric,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (enrollment_id, session_number)
);

alter table public.attendance_records enable row level security;

drop policy if exists "Admin dashboard can read attendance records" on public.attendance_records;
drop policy if exists "Admin dashboard can create attendance records" on public.attendance_records;
drop policy if exists "Admin dashboard can update attendance records" on public.attendance_records;
drop policy if exists "Admin dashboard can delete attendance records" on public.attendance_records;
create policy "Admin dashboard can read attendance records" on public.attendance_records for select to anon using (true);
create policy "Admin dashboard can create attendance records" on public.attendance_records for insert to anon with check (true);
create policy "Admin dashboard can update attendance records" on public.attendance_records for update to anon using (true) with check (true);
create policy "Admin dashboard can delete attendance records" on public.attendance_records for delete to anon using (true);
