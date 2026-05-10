-- Enable RLS for attendance_records
alter table public.attendance_records enable row level security;

-- Add policies for attendance_records to allow anon operations
drop policy if exists "Admin dashboard can read attendance_records" on public.attendance_records;
drop policy if exists "Admin dashboard can create attendance_records" on public.attendance_records;
drop policy if exists "Admin dashboard can update attendance_records" on public.attendance_records;
drop policy if exists "Admin dashboard can delete attendance_records" on public.attendance_records;

create policy "Admin dashboard can read attendance_records" on public.attendance_records for select to anon using (true);
create policy "Admin dashboard can create attendance_records" on public.attendance_records for insert to anon with check (true);
create policy "Admin dashboard can update attendance_records" on public.attendance_records for update to anon using (true) with check (true);
create policy "Admin dashboard can delete attendance_records" on public.attendance_records for delete to anon using (true);

-- Fix Security Definer View warning for public.alumni
-- In Postgres 15+, we can set security_invoker = true on the view
-- We'll wrap it in a DO block in case the view doesn't exist
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_views WHERE schemaname = 'public' AND viewname = 'alumni') THEN
        ALTER VIEW public.alumni SET (security_invoker = true);
    END IF;
END $$;
