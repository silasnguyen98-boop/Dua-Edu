-- Table to track which assistant is assigned to which class
create table if not exists public.class_assistants (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  user_id uuid not null,
  user_email text,
  user_name text,
  created_at timestamptz not null default now(),
  unique(class_id, user_id)
);

alter table public.class_assistants enable row level security;

-- Authenticated users can read all assignments
create policy "Authenticated can read class_assistants"
  on public.class_assistants for select to authenticated using (true);

-- Authenticated users can insert/delete
create policy "Authenticated can insert class_assistants"
  on public.class_assistants for insert to authenticated with check (true);

create policy "Authenticated can delete class_assistants"
  on public.class_assistants for delete to authenticated using (true);

-- Anon can also read (so assistant check can happen)
create policy "Anon can read class_assistants"
  on public.class_assistants for select to anon using (true);
