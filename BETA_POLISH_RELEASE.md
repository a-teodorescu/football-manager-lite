# v4.0.0 — Beta Polish Release

This release turns Football Manager Lite from a feature-heavy prototype into a cleaner beta candidate.

## What changed

- Added a new **Release** tab.
- Added centralized launch readiness checks across Beta, Stability, Admin, Real Database Mode, Multiplayer and Advanced Tactics.
- Added portable save JSON export from the Release tab.
- Added copyable release notes for tester handoff.
- Added `npm run release`.
- Added `src/engine/betaPolishRelease.ts` and `src/engine/testBetaPolishRelease.ts`.
- Updated save schema to `40`.

## Release QA flow

Run these before creating a ZIP or deploying to Netlify:

```bash
npm run check
npm run build
npm run release
npm run fullcheck
```

## Live smoke test

1. Deploy to Netlify with build command `npm run build` and publish directory `dist`.
2. Run `supabase/schema.sql` in Supabase SQL Editor.
3. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Netlify.
4. Register a fresh test account.
5. Create a club.
6. Save local and cloud.
7. Reload the page and load cloud.
8. Simulate one league round.
9. Review Match, Inbox, Finance, Board, QA Live and Release.
10. Export Admin debug packet if any issue appears.

## Important note

The existing JSON save remains the safest fallback. Real Database Mode is a mirror layer for future analytics, multiplayer and admin tooling.

## v4.1 follow-up

The next release, `v4.1.0`, keeps the v4.0 beta scope but optimizes deployment by splitting the production build into React vendor, engine, services and app-shell chunks. This resolves the previous large single JS bundle warning while preserving the simple Netlify build command.
