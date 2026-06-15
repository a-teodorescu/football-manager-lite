# Football Manager Lite - Public Beta Checklist

Version: `2.0.0`

Use this checklist before sharing a Netlify link with testers.

## 1. Supabase setup

- Create or open your Supabase project.
- Run `supabase/schema.sql` in Supabase SQL Editor.
- Confirm table `manager_saves` exists.
- Confirm RLS is enabled.
- Confirm policies use `auth.uid()` and `manager_id`.

## 2. Netlify setup

Required build settings:

```txt
Build command: npm run build
Publish directory: dist
Node version: 20
NPM_CONFIG_PRODUCTION=false
NPM_FLAGS=--include=dev
```

Required environment variables:

```txt
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 3. Manual smoke test

Run this on the deployed Netlify site:

1. Register a new test user with email/password.
2. Create a club.
3. Open Dashboard and verify onboarding appears.
4. Save locally.
5. Save to Supabase.
6. Run one training session.
7. Simulate one league round.
8. Open Match and verify the post-match report.
9. Open Fitness and verify player status.
10. Open Finance and verify a round report exists.
11. Open Board and run a board review.
12. Open Beta and confirm there are no blockers.
13. Refresh the browser.
14. Login again if needed.
15. Load from Supabase and verify the career returns.

## 4. Package rules

The release ZIP must not include:

- `node_modules`
- `dist`
- `.git`
- `.vite`
- `package-lock.json`

## 5. Known MVP limitations

- Match engine is deterministic and simplified.
- Opponent AI is basic.
- Transfer market uses generated free agents, not real players.
- Supabase is used through REST endpoints, not the Supabase JS SDK, to keep the build small.
- The game is ready for beta feedback, not production monetization.
