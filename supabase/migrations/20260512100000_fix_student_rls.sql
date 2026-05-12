-- Fix RLS policies for students table to allow authenticated users to import/manage data
-- This migration ensures that both INSERT and SELECT policies are correctly set for authenticated users.

-- 1. Drop existing policies to avoid conflicts
drop policy if exists "Admin dashboard can create students" on public.students;
drop policy if exists "Admin dashboard can read students" on public.students;
drop policy if exists "Admin dashboard can update students" on public.students;
drop policy if exists "Admin dashboard can delete students" on public.students;
drop policy if exists "Admin dashboard can read students as authenticated" on public.students;
drop policy if exists "Admin dashboard can read students auth" on public.students;

-- 2. Ensure RLS is enabled
alter table public.students enable row level security;

-- 3. Create clean, comprehensive policies for authenticated users
-- INSERT policy (required for import)
create policy "Authenticated users can insert students"
on public.students for insert to authenticated
with check (true);

-- SELECT policy (required for reading and for RETURNING clause after insert)
create policy "Authenticated users can select students"
on public.students for select to authenticated
using (true);

-- UPDATE policy
create policy "Authenticated users can update students"
on public.students for update to authenticated
using (true) with check (true);

-- DELETE policy
create policy "Authenticated users can delete students"
on public.students for delete to authenticated
using (true);

-- 4. Also allow anon select if the tra cứu (tra_cuu) feature needs it
drop policy if exists "Anon can read students" on public.students;
create policy "Anon can read students"
on public.students for select to anon
using (true);
