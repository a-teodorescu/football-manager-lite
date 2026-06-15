# Live Deploy & QA Stabilization — v2.1.0

This release is focused on getting the project ready for real Netlify + Supabase testing, without adding heavy dependencies or changing the core architecture.

## Netlify settings

Use the existing fast build profile:

- Build command: `npm run build`
- Publish directory: `dist`
- Node version: `20`
- Environment:
  - `NODE_VERSION=20`
  - `NPM_CONFIG_PRODUCTION=false`
  - `NPM_FLAGS=--include=dev`
  - `VITE_SUPABASE_URL=<your Supabase project URL>`
  - `VITE_SUPABASE_ANON_KEY=<your Supabase anon public key>`

Do not commit `node_modules`, `dist`, `.vite`, `.git`, or `package-lock.json` in generated release archives.

## Supabase setup

1. Open Supabase SQL Editor.
2. Run `supabase/schema.sql`.
3. Confirm the table exists: `public.manager_saves`.
4. Confirm RLS is enabled.
5. Confirm policies use `auth.uid()` so each user can only read/write/delete their own save.
6. Enable email/password auth in Supabase Auth settings.

## Live QA smoke test

After deploy, use a fresh browser profile or incognito window and run this flow:

1. Register a new user with email/password.
2. Create a club.
3. Open the `QA Live` tab.
4. Click `Save local`.
5. Refresh the browser, then click `Load local`.
6. Click `Save Supabase`.
7. Click `Load Supabase`.
8. Simulate one league round.
9. Open Match report and confirm the report appears.
10. Run Board Review.
11. Simulate all remaining rounds.
12. Start a new season.
13. Logout, login again, and load Supabase save.

## QA Live tab

The new `QA Live` tab contains:

- environment and auth health checks;
- local/cloud save status;
- smoke test checklist;
- local reset button;
- Supabase save delete button;
- debug packet for screenshots and bug reports.

The debug packet intentionally does not show passwords or secret keys.

## Reset safety

`Reset cariera locala` only clears the current user's localStorage save and returns to club setup. It does not delete the Supabase save.

`Sterge Supabase save` only deletes the authenticated user's cloud save through RLS-protected Supabase REST calls.
