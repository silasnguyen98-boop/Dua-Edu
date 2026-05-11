drop policy if exists "Admin dashboard can read students as authenticated" on public.students;
create policy "Admin dashboard can read students as authenticated"
on public.students for select to authenticated using (true);

drop policy if exists "Admin dashboard can read teachers as authenticated" on public.teachers;
create policy "Admin dashboard can read teachers as authenticated"
on public.teachers for select to authenticated using (true);

drop policy if exists "Admin dashboard can read courses as authenticated" on public.courses;
create policy "Admin dashboard can read courses as authenticated"
on public.courses for select to authenticated using (true);

drop policy if exists "Admin dashboard can read classes as authenticated" on public.classes;
create policy "Admin dashboard can read classes as authenticated"
on public.classes for select to authenticated using (true);

drop policy if exists "Admin dashboard can read enrollments as authenticated" on public.enrollments;
create policy "Admin dashboard can read enrollments as authenticated"
on public.enrollments for select to authenticated using (true);

drop policy if exists "Admin dashboard can read certificates as authenticated" on public.certificates;
create policy "Admin dashboard can read certificates as authenticated"
on public.certificates for select to authenticated using (true);

drop policy if exists "Admin dashboard can read class_sessions as authenticated" on public.class_sessions;
create policy "Admin dashboard can read class_sessions as authenticated"
on public.class_sessions for select to authenticated using (true);

drop policy if exists "Admin dashboard can read attendance_records as authenticated" on public.attendance_records;
create policy "Admin dashboard can read attendance_records as authenticated"
on public.attendance_records for select to authenticated using (true);

do $$
begin
  if to_regclass('public.assignment_records') is not null then
    execute 'drop policy if exists "Admin dashboard can read assignment_records as authenticated" on public.assignment_records';
    execute 'create policy "Admin dashboard can read assignment_records as authenticated" on public.assignment_records for select to authenticated using (true)';
  end if;
end $$;
