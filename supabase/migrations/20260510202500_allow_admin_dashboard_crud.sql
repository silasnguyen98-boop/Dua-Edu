alter table public.students enable row level security;
alter table public.teachers enable row level security;
alter table public.courses enable row level security;
alter table public.classes enable row level security;
alter table public.enrollments enable row level security;
alter table public.certificates enable row level security;

drop policy if exists "Admin dashboard can read students" on public.students;
drop policy if exists "Admin dashboard can create students" on public.students;
drop policy if exists "Admin dashboard can update students" on public.students;
drop policy if exists "Admin dashboard can delete students" on public.students;
create policy "Admin dashboard can read students" on public.students for select to anon using (true);
create policy "Admin dashboard can create students" on public.students for insert to anon with check (true);
create policy "Admin dashboard can update students" on public.students for update to anon using (true) with check (true);
create policy "Admin dashboard can delete students" on public.students for delete to anon using (true);

drop policy if exists "Admin dashboard can read teachers" on public.teachers;
drop policy if exists "Admin dashboard can create teachers" on public.teachers;
drop policy if exists "Admin dashboard can update teachers" on public.teachers;
drop policy if exists "Admin dashboard can delete teachers" on public.teachers;
create policy "Admin dashboard can read teachers" on public.teachers for select to anon using (true);
create policy "Admin dashboard can create teachers" on public.teachers for insert to anon with check (true);
create policy "Admin dashboard can update teachers" on public.teachers for update to anon using (true) with check (true);
create policy "Admin dashboard can delete teachers" on public.teachers for delete to anon using (true);

drop policy if exists "Admin dashboard can read courses" on public.courses;
drop policy if exists "Admin dashboard can create courses" on public.courses;
drop policy if exists "Admin dashboard can update courses" on public.courses;
drop policy if exists "Admin dashboard can delete courses" on public.courses;
create policy "Admin dashboard can read courses" on public.courses for select to anon using (true);
create policy "Admin dashboard can create courses" on public.courses for insert to anon with check (true);
create policy "Admin dashboard can update courses" on public.courses for update to anon using (true) with check (true);
create policy "Admin dashboard can delete courses" on public.courses for delete to anon using (true);

drop policy if exists "Admin dashboard can read classes" on public.classes;
drop policy if exists "Admin dashboard can create classes" on public.classes;
drop policy if exists "Admin dashboard can update classes" on public.classes;
drop policy if exists "Admin dashboard can delete classes" on public.classes;
create policy "Admin dashboard can read classes" on public.classes for select to anon using (true);
create policy "Admin dashboard can create classes" on public.classes for insert to anon with check (true);
create policy "Admin dashboard can update classes" on public.classes for update to anon using (true) with check (true);
create policy "Admin dashboard can delete classes" on public.classes for delete to anon using (true);

drop policy if exists "Admin dashboard can read enrollments" on public.enrollments;
drop policy if exists "Admin dashboard can create enrollments" on public.enrollments;
drop policy if exists "Admin dashboard can update enrollments" on public.enrollments;
drop policy if exists "Admin dashboard can delete enrollments" on public.enrollments;
create policy "Admin dashboard can read enrollments" on public.enrollments for select to anon using (true);
create policy "Admin dashboard can create enrollments" on public.enrollments for insert to anon with check (true);
create policy "Admin dashboard can update enrollments" on public.enrollments for update to anon using (true) with check (true);
create policy "Admin dashboard can delete enrollments" on public.enrollments for delete to anon using (true);

drop policy if exists "Admin dashboard can read certificates" on public.certificates;
drop policy if exists "Admin dashboard can create certificates" on public.certificates;
drop policy if exists "Admin dashboard can update certificates" on public.certificates;
drop policy if exists "Admin dashboard can delete certificates" on public.certificates;
create policy "Admin dashboard can read certificates" on public.certificates for select to anon using (true);
create policy "Admin dashboard can create certificates" on public.certificates for insert to anon with check (true);
create policy "Admin dashboard can update certificates" on public.certificates for update to anon using (true) with check (true);
create policy "Admin dashboard can delete certificates" on public.certificates for delete to anon using (true);
