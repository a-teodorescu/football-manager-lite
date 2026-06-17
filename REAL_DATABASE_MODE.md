# Real Database Mode - v3.5.0

Football Manager Lite still keeps `manager_saves.payload` as the canonical rollback-safe save format. v3.5 adds an optional relational mirror for Supabase so the game can later support richer admin dashboards, searchable records, public club pages, friends leagues and multiplayer.

## What changed

New tables added in `supabase/schema.sql`:

- `manager_profiles`
- `club_players`
- `league_fixtures`
- `league_results`
- `finance_ledger`
- `manager_inbox`

Every table has `manager_id uuid` and RLS policies using `auth.uid()`, so authenticated users can only read/write/delete their own rows.

## Important design choice

`manager_saves` remains the source of truth for now.

The real tables are a mirror layer. This keeps the app safe while we move gradually from one JSON payload to normalized tables.

## How to enable

1. Open Supabase SQL Editor.
2. Run the full `supabase/schema.sql` file.
3. Confirm these tables exist:
   - `manager_profiles`
   - `club_players`
   - `league_fixtures`
   - `league_results`
   - `finance_ledger`
   - `manager_inbox`
4. Keep Netlify env vars:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Login in the app and open the new **Database** tab.

## Developer files

- `src/engine/realDatabaseMode.ts` builds the readiness/reporting layer.
- `src/lib/realDatabaseService.ts` converts a save payload into normalized database rows and includes a sync helper.
- `src/engine/testRealDatabaseMode.ts` validates snapshot generation and readiness checks.

## Test command

```bash
npm run database
```

Or run everything:

```bash
npm run fullcheck
```

## Why this matters

This is the base for future versions like:

- friends league / multiplayer;
- admin analytics;
- searchable player database;
- public club pages;
- season history charts;
- real leaderboards.
