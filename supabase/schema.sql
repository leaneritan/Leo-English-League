-- LEEA cloud homework schema.
-- Run this in the Supabase SQL editor.

create table if not exists public.leea_homework (
  family_id text not null,
  homework_id text not null,
  lesson text not null,
  unit text not null,
  url text not null,
  due_date date not null,
  assigned_date date not null default current_date,
  completed_date date,
  status text not null default 'assigned'
    check (status in ('assigned', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (family_id, homework_id)
);

create table if not exists public.leea_progress (
  family_id text not null,
  homework_id text not null,
  storage_key text not null,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (family_id, homework_id, storage_key)
);

create or replace function public.set_leea_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_leea_homework_updated_at on public.leea_homework;
create trigger set_leea_homework_updated_at
before update on public.leea_homework
for each row execute function public.set_leea_updated_at();

drop trigger if exists set_leea_progress_updated_at on public.leea_progress;
create trigger set_leea_progress_updated_at
before update on public.leea_progress
for each row execute function public.set_leea_updated_at();

alter table public.leea_homework enable row level security;
alter table public.leea_progress enable row level security;

grant usage on schema public to anon;
grant select, insert, update, delete on public.leea_homework to anon;
grant select, insert, update, delete on public.leea_progress to anon;

-- For the first family-only version, the browser uses the anon key.
-- This makes homework sync work from static HTML. It is acceptable for a
-- private family tool, but not for a public multi-student product.
drop policy if exists "LEEA anon read homework" on public.leea_homework;
create policy "LEEA anon read homework"
on public.leea_homework
for select
to anon
using (family_id = 'neritan-leo');

drop policy if exists "LEEA anon write homework" on public.leea_homework;
create policy "LEEA anon write homework"
on public.leea_homework
for all
to anon
using (family_id = 'neritan-leo')
with check (family_id = 'neritan-leo');

drop policy if exists "LEEA anon read progress" on public.leea_progress;
create policy "LEEA anon read progress"
on public.leea_progress
for select
to anon
using (family_id = 'neritan-leo');

drop policy if exists "LEEA anon write progress" on public.leea_progress;
create policy "LEEA anon write progress"
on public.leea_progress
for all
to anon
using (family_id = 'neritan-leo')
with check (family_id = 'neritan-leo');
