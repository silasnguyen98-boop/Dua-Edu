-- Allow authenticated users to read all tables
create policy "Admin dashboard can read students auth" on public.students for select to authenticated using (true);
create policy "Admin dashboard can read teachers auth" on public.teachers for select to authenticated using (true);
create policy "Admin dashboard can read courses auth" on public.courses for select to authenticated using (true);
create policy "Admin dashboard can read classes auth" on public.classes for select to authenticated using (true);
create policy "Admin dashboard can read enrollments auth" on public.enrollments for select to authenticated using (true);
create policy "Admin dashboard can read certificates auth" on public.certificates for select to authenticated using (true);
create policy "Admin dashboard can read class_sessions auth" on public.class_sessions for select to authenticated using (true);
create policy "Admin dashboard can read attendance_records auth" on public.attendance_records for select to authenticated using (true);
