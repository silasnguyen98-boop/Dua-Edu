create table if not exists public.student_account_credentials (
  auth_user_id uuid primary key references auth.users(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  initial_password text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.student_account_credentials enable row level security;

drop policy if exists "No direct client access to student account credentials"
on public.student_account_credentials;

