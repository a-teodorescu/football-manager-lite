-- Football Manager Lite v0.6 - authenticated per-user save table.
-- Run this in Supabase SQL Editor after enabling Supabase Auth.
-- Each authenticated user can read/write only their own save through auth.uid(). The club profile is stored inside payload jsonb.

create table if not exists public.manager_saves (
  manager_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

-- Upgrade helper for the old demo schema where manager_id was text.
-- It removes old non-UUID demo rows and converts UUID-looking text ids to uuid.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'manager_saves'
      and column_name = 'manager_id'
      and udt_name <> 'uuid'
  ) then
    execute 'delete from public.manager_saves where manager_id !~* ''^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$''';
    execute 'alter table public.manager_saves alter column manager_id type uuid using manager_id::uuid';
  end if;
end $$;

alter table public.manager_saves enable row level security;

-- Remove old demo policies if they exist.
drop policy if exists "Allow demo manager save reads" on public.manager_saves;
drop policy if exists "Allow demo manager save upserts" on public.manager_saves;
drop policy if exists "Allow demo manager save updates" on public.manager_saves;

-- Replace previous authenticated policies if re-running this file.
drop policy if exists "Users can read own manager save" on public.manager_saves;
drop policy if exists "Users can insert own manager save" on public.manager_saves;
drop policy if exists "Users can update own manager save" on public.manager_saves;
drop policy if exists "Users can delete own manager save" on public.manager_saves;

create policy "Users can read own manager save"
  on public.manager_saves
  for select
  to authenticated
  using (manager_id = auth.uid());

create policy "Users can insert own manager save"
  on public.manager_saves
  for insert
  to authenticated
  with check (manager_id = auth.uid());

create policy "Users can update own manager save"
  on public.manager_saves
  for update
  to authenticated
  using (manager_id = auth.uid())
  with check (manager_id = auth.uid());

create policy "Users can delete own manager save"
  on public.manager_saves
  for delete
  to authenticated
  using (manager_id = auth.uid());
