# v3.6.0 — Multiplayer / Friends League

This release prepares Football Manager Lite for a lightweight friends league mode.

## What it adds

- New **Multiplayer** tab in the app.
- Deterministic league code / invite code for the current manager career.
- Friends leaderboard projection for manager comparison.
- Supabase schema additions for shared league rooms and member snapshots.
- JSON save remains the safe fallback; multiplayer reads from relational mirror rows.

## New Supabase tables

- `friends_leagues`
- `friends_league_members`
- `friends_league_snapshots`

All tables use RLS and are scoped by `auth.uid()`.

## Recommended live test

1. Run the full `supabase/schema.sql` in Supabase SQL editor.
2. Deploy on Netlify with the same env vars as v3.5.
3. Register/login with a test user.
4. Create a club and save to Supabase.
5. Sync Real Database Mode.
6. Open Multiplayer and copy the join code.
7. Create a second test account and validate the friends league rows.

## Important

This is a beta-ready multiplayer foundation, not real-time multiplayer. It is designed around manager snapshots, friends league membership and leaderboard comparison.
