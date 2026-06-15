-- Football Manager Lite - minimal save table for the browser MVP.
-- Run this in Supabase SQL Editor before enabling cloud saves.

create table if not exists public.manager_saves (
  manager_id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.manager_saves enable row level security;

-- MVP policy: allows anonymous demo saves.
-- Later, when we add Supabase Auth, we will replace this with user-based policies.
drop policy if exists "Allow demo manager save reads" on public.manager_saves;
create policy "Allow demo manager save reads"
  on public.manager_saves
  for select
  using (manager_id = 'local-demo-manager');

drop policy if exists "Allow demo manager save upserts" on public.manager_saves;
create policy "Allow demo manager save upserts"
  on public.manager_saves
  for insert
  with check (manager_id = 'local-demo-manager');

drop policy if exists "Allow demo manager save updates" on public.manager_saves;
create policy "Allow demo manager save updates"
  on public.manager_saves
  for update
  using (manager_id = 'local-demo-manager')
  with check (manager_id = 'local-demo-manager');
