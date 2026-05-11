create table if not exists public.class_assistants (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  assistant_id uuid not null,
  assigned_by uuid,
  assigned_at timestamptz not null default now(),
  status text not null default 'active',
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(class_id, assistant_id)
);

alter table public.class_assistants add column if not exists assistant_id uuid;
alter table public.class_assistants add column if not exists assigned_by uuid;
alter table public.class_assistants add column if not exists assigned_at timestamptz not null default now();
alter table public.class_assistants add column if not exists status text not null default 'active';
alter table public.class_assistants add column if not exists note text;
alter table public.class_assistants add column if not exists updated_at timestamptz not null default now();

do $$
begin
  alter table public.class_assistants add constraint class_assistants_class_id_assistant_id_key unique (class_id, assistant_id);
exception
  when duplicate_table then null;
end $$;

alter table public.class_assistants enable row level security;

drop policy if exists "Authenticated can read class_assistants" on public.class_assistants;
create policy "Authenticated can read class_assistants"
  on public.class_assistants for select to authenticated using (true);

drop policy if exists "Authenticated can insert class_assistants" on public.class_assistants;
create policy "Authenticated can insert class_assistants"
  on public.class_assistants for insert to authenticated with check (true);

drop policy if exists "Authenticated can update class_assistants" on public.class_assistants;
create policy "Authenticated can update class_assistants"
  on public.class_assistants for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated can delete class_assistants" on public.class_assistants;
create policy "Authenticated can delete class_assistants"
  on public.class_assistants for delete to authenticated using (true);

drop policy if exists "Anon can read class_assistants" on public.class_assistants;
create policy "Anon can read class_assistants"
  on public.class_assistants for select to anon using (true);
