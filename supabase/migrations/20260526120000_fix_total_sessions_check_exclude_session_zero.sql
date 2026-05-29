-- Fix trigger chặn việc giảm classes.total_sessions:
-- Trigger cũ count toàn bộ rows trong class_sessions, kể cả "buổi 0".
-- Sau khi cho phép session_number=0 (xem 20260520000100_allow_session_zero_in_class_sessions.sql),
-- các lớp có buổi 0 bị chặn sửa total_sessions với lỗi:
--   "total_sessions X cannot be less than existing class_sessions Y".
-- Trigger này phải bỏ qua session_number = 0 vì buổi 0 không tính vào total_sessions.

-- 1) Drop mọi trigger hiện có trên public.classes mà function của nó có chứa
-- chuỗi "cannot be less than" (định danh trigger gốc một cách an toàn,
-- vì trigger được tạo ngoài migration và không rõ tên).
do $$
declare
  trg record;
  fn  record;
begin
  for trg in
    select tg.tgname, p.oid as proc_oid, p.proname
    from pg_trigger tg
    join pg_proc p on p.oid = tg.tgfoid
    where tg.tgrelid = 'public.classes'::regclass
      and not tg.tgisinternal
      and pg_get_functiondef(p.oid) ilike '%cannot be less than%'
  loop
    execute format('drop trigger if exists %I on public.classes', trg.tgname);
  end loop;

  -- Drop function cũ (nếu còn dangling sau khi mọi trigger gắn vào nó đã bị drop)
  for fn in
    select p.oid, p.proname, pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and pg_get_functiondef(p.oid) ilike '%cannot be less than existing class_sessions%'
  loop
    execute format('drop function if exists %I.%I(%s) cascade', 'public', fn.proname, fn.args);
  end loop;
end$$;

-- 2) Tạo lại function & trigger mới — loại trừ buổi 0.
create or replace function public.check_total_sessions_not_less_than_existing()
returns trigger
language plpgsql
as $$
declare
  existing_count int;
begin
  if new.total_sessions is null then
    return new;
  end if;

  select count(*)
    into existing_count
    from public.class_sessions
   where class_id = new.id
     and session_number > 0;

  if new.total_sessions < existing_count then
    raise exception 'total_sessions % cannot be less than existing class_sessions %',
      new.total_sessions, existing_count
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_check_total_sessions_not_less_than_existing on public.classes;
create trigger trg_check_total_sessions_not_less_than_existing
before insert or update of total_sessions on public.classes
for each row
execute function public.check_total_sessions_not_less_than_existing();
