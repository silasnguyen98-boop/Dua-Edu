-- Recalculate assignment_score from only assignment_records that have an entered score.
-- Empty/unentered assignments should not reduce the average; a real score of 0 still counts.

do $$
declare
  trg record;
  fn record;
begin
  if to_regclass('public.assignment_records') is null then
    return;
  end if;

  for trg in
    select tg.tgname
      from pg_trigger tg
      join pg_proc p on p.oid = tg.tgfoid
     where tg.tgrelid = 'public.assignment_records'::regclass
       and not tg.tgisinternal
       and pg_get_functiondef(p.oid) ilike '%assignment_score%'
  loop
    execute format('drop trigger if exists %I on public.assignment_records', trg.tgname);
  end loop;

  for fn in
    select p.proname, pg_get_function_identity_arguments(p.oid) as args
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and pg_get_functiondef(p.oid) ilike '%assignment_score%'
       and pg_get_functiondef(p.oid) ilike '%assignment_records%'
  loop
    execute format('drop function if exists %I.%I(%s) cascade', 'public', fn.proname, fn.args);
  end loop;
end$$;

create or replace function public.recalculate_assignment_score_from_records()
returns trigger
language plpgsql
as $$
declare
  target_enrollment_id uuid;
  next_score numeric;
begin
  if TG_OP = 'DELETE' then
    target_enrollment_id := old.enrollment_id;
  else
    target_enrollment_id := new.enrollment_id;
  end if;

  select round(avg(score)::numeric, 2)
    into next_score
    from public.assignment_records
   where enrollment_id = target_enrollment_id
     and score is not null;

  update public.enrollments
     set assignment_score = coalesce(next_score, 0)
   where id = target_enrollment_id;

  if TG_OP = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_recalculate_assignment_score_from_records on public.assignment_records;
create trigger trg_recalculate_assignment_score_from_records
after insert or update of score or delete on public.assignment_records
for each row
execute function public.recalculate_assignment_score_from_records();

-- Backfill existing enrollment averages immediately after replacing the trigger.
update public.enrollments e
   set assignment_score = coalesce(scores.avg_score, 0)
  from (
    select enrollment_id, round(avg(score)::numeric, 2) as avg_score
      from public.assignment_records
     where score is not null
     group by enrollment_id
  ) scores
 where e.id = scores.enrollment_id;

update public.enrollments e
   set assignment_score = 0
 where not exists (
   select 1
     from public.assignment_records ar
    where ar.enrollment_id = e.id
      and ar.score is not null
 );
