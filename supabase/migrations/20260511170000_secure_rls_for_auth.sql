-- Revoke anon permissions to modify core tables
drop policy if exists "Admin dashboard can create students" on public.students;
drop policy if exists "Admin dashboard can update students" on public.students;
drop policy if exists "Admin dashboard can delete students" on public.students;

drop policy if exists "Admin dashboard can create teachers" on public.teachers;
drop policy if exists "Admin dashboard can update teachers" on public.teachers;
drop policy if exists "Admin dashboard can delete teachers" on public.teachers;

drop policy if exists "Admin dashboard can create courses" on public.courses;
drop policy if exists "Admin dashboard can update courses" on public.courses;
drop policy if exists "Admin dashboard can delete courses" on public.courses;

drop policy if exists "Admin dashboard can create classes" on public.classes;
drop policy if exists "Admin dashboard can update classes" on public.classes;
drop policy if exists "Admin dashboard can delete classes" on public.classes;

drop policy if exists "Admin dashboard can create enrollments" on public.enrollments;
drop policy if exists "Admin dashboard can update enrollments" on public.enrollments;
drop policy if exists "Admin dashboard can delete enrollments" on public.enrollments;

drop policy if exists "Admin dashboard can create certificates" on public.certificates;
drop policy if exists "Admin dashboard can update certificates" on public.certificates;
drop policy if exists "Admin dashboard can delete certificates" on public.certificates;

drop policy if exists "Admin dashboard can create class_sessions" on public.class_sessions;
drop policy if exists "Admin dashboard can update class_sessions" on public.class_sessions;
drop policy if exists "Admin dashboard can delete class_sessions" on public.class_sessions;

drop policy if exists "Admin dashboard can create attendance_records" on public.attendance_records;
drop policy if exists "Admin dashboard can update attendance_records" on public.attendance_records;
drop policy if exists "Admin dashboard can delete attendance_records" on public.attendance_records;

-- Only allow authenticated users to modify data
create policy "Admin dashboard can create students" on public.students for insert to authenticated with check (true);
create policy "Admin dashboard can update students" on public.students for update to authenticated using (true) with check (true);
create policy "Admin dashboard can delete students" on public.students for delete to authenticated using (true);

create policy "Admin dashboard can create teachers" on public.teachers for insert to authenticated with check (true);
create policy "Admin dashboard can update teachers" on public.teachers for update to authenticated using (true) with check (true);
create policy "Admin dashboard can delete teachers" on public.teachers for delete to authenticated using (true);

create policy "Admin dashboard can create courses" on public.courses for insert to authenticated with check (true);
create policy "Admin dashboard can update courses" on public.courses for update to authenticated using (true) with check (true);
create policy "Admin dashboard can delete courses" on public.courses for delete to authenticated using (true);

create policy "Admin dashboard can create classes" on public.classes for insert to authenticated with check (true);
create policy "Admin dashboard can update classes" on public.classes for update to authenticated using (true) with check (true);
create policy "Admin dashboard can delete classes" on public.classes for delete to authenticated using (true);

create policy "Admin dashboard can create enrollments" on public.enrollments for insert to authenticated with check (true);
create policy "Admin dashboard can update enrollments" on public.enrollments for update to authenticated using (true) with check (true);
create policy "Admin dashboard can delete enrollments" on public.enrollments for delete to authenticated using (true);

create policy "Admin dashboard can create certificates" on public.certificates for insert to authenticated with check (true);
create policy "Admin dashboard can update certificates" on public.certificates for update to authenticated using (true) with check (true);
create policy "Admin dashboard can delete certificates" on public.certificates for delete to authenticated using (true);

create policy "Admin dashboard can create class_sessions" on public.class_sessions for insert to authenticated with check (true);
create policy "Admin dashboard can update class_sessions" on public.class_sessions for update to authenticated using (true) with check (true);
create policy "Admin dashboard can delete class_sessions" on public.class_sessions for delete to authenticated using (true);

create policy "Admin dashboard can create attendance_records" on public.attendance_records for insert to authenticated with check (true);
create policy "Admin dashboard can update attendance_records" on public.attendance_records for update to authenticated using (true) with check (true);
create policy "Admin dashboard can delete attendance_records" on public.attendance_records for delete to authenticated using (true);
