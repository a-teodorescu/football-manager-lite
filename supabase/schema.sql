-- Football Manager Lite v3.5 - authenticated JSON save plus optional Real Database Mode mirror tables.
-- Run this in Supabase SQL Editor after enabling Supabase Auth.
-- Each authenticated user can read/write only their own save through auth.uid(). The club profile, training, transfers, finance, academy, cup, board objectives, live QA state signals and multi-season history state are stored inside payload jsonb.

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

-- v3.5 Real Database Mode mirror tables.
-- Keep public.manager_saves as the canonical JSON fallback. The tables below are a relational mirror
-- for QA, reporting, future admin pages and future friends-league/multiplayer work.

create table if not exists public.manager_profiles (
  manager_id uuid primary key references auth.users(id) on delete cascade,
  club_name text not null,
  city text,
  season_number integer not null default 1,
  current_round integer not null default 1,
  save_schema_version integer not null default 34,
  payload_updated_at timestamptz,
  tactic jsonb,
  cash_balance integer,
  transfer_budget integer,
  updated_at timestamptz not null default now()
);

create table if not exists public.club_players (
  manager_id uuid not null references auth.users(id) on delete cascade,
  player_id text not null,
  name text not null,
  position text not null,
  age integer not null,
  overall integer not null,
  potential integer,
  nationality text,
  country_code text,
  preferred_foot text,
  personality text,
  role text,
  marketability integer,
  contract_wage integer,
  fitness integer,
  morale integer,
  injured_rounds_remaining integer not null default 0,
  market_value integer,
  updated_at timestamptz not null default now(),
  primary key (manager_id, player_id)
);

create table if not exists public.league_fixtures (
  manager_id uuid not null references auth.users(id) on delete cascade,
  fixture_id text not null,
  season_number integer not null,
  round integer not null,
  home_team_id text not null,
  home_team_name text not null,
  away_team_id text not null,
  away_team_name text not null,
  played boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (manager_id, fixture_id)
);

create table if not exists public.league_results (
  manager_id uuid not null references auth.users(id) on delete cascade,
  result_id text not null,
  fixture_id text not null,
  season_number integer not null,
  round integer not null,
  home_team_id text not null,
  away_team_id text not null,
  home_score integer not null,
  away_score integer not null,
  home_xg numeric,
  away_xg numeric,
  match_seed text,
  updated_at timestamptz not null default now(),
  primary key (manager_id, result_id)
);

create table if not exists public.finance_ledger (
  manager_id uuid not null references auth.users(id) on delete cascade,
  entry_id text not null,
  season_number integer not null,
  round integer not null,
  sponsor_income integer not null default 0,
  matchday_income integer not null default 0,
  performance_bonus integer not null default 0,
  wage_cost integer not null default 0,
  net_change integer not null default 0,
  balance_after integer not null default 0,
  summary text,
  updated_at timestamptz not null default now(),
  primary key (manager_id, entry_id)
);

create table if not exists public.manager_inbox (
  manager_id uuid not null references auth.users(id) on delete cascade,
  message_id text not null,
  season_number integer not null,
  round integer not null,
  category text not null,
  tone text not null,
  title text not null,
  body text not null,
  source text not null,
  target_tab text not null,
  created_at timestamptz not null,
  read boolean not null default false,
  pinned boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (manager_id, message_id)
);

create index if not exists club_players_manager_position_idx on public.club_players (manager_id, position);
create index if not exists league_fixtures_manager_round_idx on public.league_fixtures (manager_id, round);
create index if not exists league_results_manager_round_idx on public.league_results (manager_id, round);
create index if not exists finance_ledger_manager_round_idx on public.finance_ledger (manager_id, season_number, round);
create index if not exists manager_inbox_manager_unread_idx on public.manager_inbox (manager_id, read, created_at desc);

alter table public.manager_profiles enable row level security;
alter table public.club_players enable row level security;
alter table public.league_fixtures enable row level security;
alter table public.league_results enable row level security;
alter table public.finance_ledger enable row level security;
alter table public.manager_inbox enable row level security;

-- Re-runnable policy setup for Real Database Mode tables.
do $$
declare
  table_name text;
begin
  foreach table_name in array array['manager_profiles','club_players','league_fixtures','league_results','finance_ledger','manager_inbox']
  loop
    execute format('drop policy if exists "Users can read own %1$s" on public.%1$I', table_name);
    execute format('drop policy if exists "Users can insert own %1$s" on public.%1$I', table_name);
    execute format('drop policy if exists "Users can update own %1$s" on public.%1$I', table_name);
    execute format('drop policy if exists "Users can delete own %1$s" on public.%1$I', table_name);

    execute format('create policy "Users can read own %1$s" on public.%1$I for select to authenticated using (manager_id = auth.uid())', table_name);
    execute format('create policy "Users can insert own %1$s" on public.%1$I for insert to authenticated with check (manager_id = auth.uid())', table_name);
    execute format('create policy "Users can update own %1$s" on public.%1$I for update to authenticated using (manager_id = auth.uid()) with check (manager_id = auth.uid())', table_name);
    execute format('create policy "Users can delete own %1$s" on public.%1$I for delete to authenticated using (manager_id = auth.uid())', table_name);
  end loop;
end $$;

-- v3.6.0 Multiplayer / Friends League tables
create table if not exists public.friends_leagues (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  league_code text not null unique,
  name text not null,
  season_number integer not null default 1,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.friends_league_members (
  league_id uuid not null references public.friends_leagues(id) on delete cascade,
  manager_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (league_id, manager_id)
);

create table if not exists public.friends_league_snapshots (
  league_id uuid not null references public.friends_leagues(id) on delete cascade,
  manager_id uuid not null references auth.users(id) on delete cascade,
  club_name text not null,
  season_number integer not null,
  current_round integer not null,
  points integer not null default 0,
  position integer not null default 1,
  job_security integer not null default 50,
  cash_balance integer not null default 0,
  snapshot jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (league_id, manager_id)
);

alter table public.friends_leagues enable row level security;
alter table public.friends_league_members enable row level security;
alter table public.friends_league_snapshots enable row level security;

drop policy if exists "friends_leagues_owner_all" on public.friends_leagues;
create policy "friends_leagues_owner_all"
  on public.friends_leagues
  for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "friends_leagues_members_read" on public.friends_leagues;
create policy "friends_leagues_members_read"
  on public.friends_leagues
  for select
  using (
    exists (
      select 1 from public.friends_league_members m
      where m.league_id = friends_leagues.id
        and m.manager_id = auth.uid()
    )
  );

drop policy if exists "friends_league_members_self_read" on public.friends_league_members;
create policy "friends_league_members_self_read"
  on public.friends_league_members
  for select
  using (
    manager_id = auth.uid()
    or exists (
      select 1 from public.friends_leagues l
      where l.id = friends_league_members.league_id
        and l.owner_id = auth.uid()
    )
  );

drop policy if exists "friends_league_members_self_insert" on public.friends_league_members;
create policy "friends_league_members_self_insert"
  on public.friends_league_members
  for insert
  with check (manager_id = auth.uid());

drop policy if exists "friends_league_snapshots_member_read" on public.friends_league_snapshots;
create policy "friends_league_snapshots_member_read"
  on public.friends_league_snapshots
  for select
  using (
    exists (
      select 1 from public.friends_league_members m
      where m.league_id = friends_league_snapshots.league_id
        and m.manager_id = auth.uid()
    )
  );

drop policy if exists "friends_league_snapshots_self_write" on public.friends_league_snapshots;
create policy "friends_league_snapshots_self_write"
  on public.friends_league_snapshots
  for all
  using (manager_id = auth.uid())
  with check (manager_id = auth.uid());

-- v3.7.0 European competitions mirror tables (optional, JSON save remains fallback)
create table if not exists public.european_competition_runs (
  id uuid primary key default gen_random_uuid(),
  manager_id uuid not null references auth.users(id) on delete cascade,
  season_number integer not null,
  status text not null default 'active',
  champion_team_name text,
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (manager_id, season_number)
);

create table if not exists public.european_competition_records (
  id text primary key,
  manager_id uuid not null references auth.users(id) on delete cascade,
  season_number integer not null,
  round_index integer not null,
  round_name text not null,
  summary text not null,
  user_participated boolean not null default false,
  user_advanced boolean not null default false,
  prize_money integer not null default 0,
  champion_team_name text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.european_competition_runs enable row level security;
alter table public.european_competition_records enable row level security;

drop policy if exists "european_competition_runs_owner_all" on public.european_competition_runs;
create policy "european_competition_runs_owner_all"
  on public.european_competition_runs
  for all
  using (manager_id = auth.uid())
  with check (manager_id = auth.uid());

drop policy if exists "european_competition_records_owner_all" on public.european_competition_records;
create policy "european_competition_records_owner_all"
  on public.european_competition_records
  for all
  using (manager_id = auth.uid())
  with check (manager_id = auth.uid());
