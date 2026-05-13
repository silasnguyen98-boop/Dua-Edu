create or replace function public.recalculate_attendance_score(target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  enrollment_uuid uuid;
  total_sessions int;
  total_points numeric := 0;
begin
  -- Prefer treating the UUID as an enrollment_id.
  select e.id
    into enrollment_uuid
  from public.enrollments e
  where e.id = target_id;

  -- Fallback: if the trigger passes an attendance_record id, resolve its enrollment.
  if enrollment_uuid is null then
    select ar.enrollment_id
      into enrollment_uuid
    from public.attendance_records ar
    where ar.id = target_id;
  end if;

  if enrollment_uuid is null then
    return;
  end if;

  select coalesce(c.total_sessions, 0)
    into total_sessions
  from public.enrollments e
  join public.classes c on c.id = e.class_id
  where e.id = enrollment_uuid;

  if total_sessions = 0 then
    update public.enrollments
      set attendance_score = 0
    where id = enrollment_uuid;
    return;
  end if;

  select coalesce(sum(
    case ar.status
      when 'present' then 1
      when 'late' then 0.75
      when 'excused' then 0.5
      else 0
    end
  ), 0)
    into total_points
  from public.attendance_records ar
  where ar.enrollment_id = enrollment_uuid;

  update public.enrollments
    set attendance_score = round((total_points / total_sessions) * 10, 2)
  where id = enrollment_uuid;
end;
$$;
