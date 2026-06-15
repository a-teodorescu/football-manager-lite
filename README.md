# Football Manager Lite

Browser/mobile football management simulator prototype.

Current version: `2.2.0`

## What is included now

- React + Vite browser interface
- Deterministic TypeScript match engine
- Supabase Auth with email/password register, login and logout
- Per-user saves using Supabase Auth `user.id`
- Real club creation flow after register/login
- Training tab with deterministic player development
- one training session per round, saved per authenticated user
- Fitness, morale and injury system after each simulated round
- Fitness tab with medical report and unavailable players
- Transfers tab with free agents, transfer budget, player sales and transfer history
- Scouting tab with deterministic scout reports, tactical fit, financial fit, squad need, risk and recommendations
- Cup tab with knockout bracket, quarter-finals, semi-finals, final, penalty tiebreakers and prize money
- Board tab with season objectives, board mood, job security, sack risk and review history
- Finance tab with cash balance, wage bill, wage budget, sponsor income, matchday income and round financial reports
- Youth Academy tab with deterministic prospects, scouting, academy upgrades and promotion to first team
- Academy upkeep cost integrated into round finance reports
- Seasons tab with multi-season progression, prize money and historical season summaries
- Manager Dashboard with board confidence, objective scores, alerts, key players and recommended next actions
- Board objectives are evaluated after league rounds, cup rounds and manual board review
- Matchday Experience with match preview, tactical recommendation, post-match analysis, Man of the Match and player ratings
- Contracts tab with contract expiry, wage demands, renewals, releases and contract history
- Mobile UI polish for dashboard cards, objectives, matchday cards and horizontal tab navigation
- New season flow keeps the user squad, ages players, resets injuries, processes expired contracts, regenerates fixtures and resets standings
- User club name, city and colors stored in the save payload
- 8 mock teams
- 14 rounds
- 56 fixtures
- round-by-round simulation
- Squad tab for the user's club
- Tactics tab with formation, mentality and pressing
- user tactic affects future matches for the created club
- standings update after every simulated round
- match report with stats, timeline, half-time score, momentum, tactical feedback and top performers
- cup rounds apply fitness, morale and injury effects without changing the league fixtures
- local save/load scoped per authenticated user
- Supabase save/load scoped per authenticated user with RLS
- Beta tab with public beta readiness score, blockers, warnings and deploy checklist
- QA Live tab with deploy health checks, reset actions and smoke test checklist
- Admin tab with save-payload validation, debug export and integrity checks
- Public beta checklist document with smoke-test steps
- Netlify-ready config

## Local setup

```bash
npm install
npm run dev
```

Open the local URL shown by Vite, usually:

```txt
http://localhost:5173
```

## Production build

```bash
npm run build
```

Vite will create the `dist` folder.

## Netlify settings

The project includes `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"
  NPM_CONFIG_PRODUCTION = "false"
  NPM_FLAGS = "--include=dev"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Required Netlify settings:

```txt
Build command: npm run build
Publish directory: dist
Node version: 20
```

## Useful scripts

```bash
npm run dev       # start browser app locally
npm run build     # production build
npm run simulate  # simulate one match in terminal
npm run batch     # run 1000 match simulations in terminal
npm run season    # simulate a full season in terminal
npm run status    # test fitness, morale and injuries in terminal
npm run transfers # test transfer market buy/sell logic in terminal
npm run finance   # test finance reports and wage bill logic in terminal
npm run academy   # test youth academy scouting, upgrade and promotion logic
npm run progression # test multi-season transition logic
npm run dashboard  # test manager dashboard rating/objective logic
npm run matchday   # test match preview and tactical feedback
npm run contracts  # test contract renewals and releases
npm run scouting   # test deterministic scouting reports and recommendations
npm run cup        # test knockout cup draw, rounds and champion
npm run board      # test board objectives, job security and reviews
npm run ux         # test Help Center and onboarding checklist
npm run beta       # test public beta readiness scoring
npm run qa         # test live deploy QA checks
npm run admin      # test admin/debug panel scoring
npm run check      # TypeScript check
```

## Browser flow

1. Register or login with email/password.
2. Create your club name, city and colors if this is a new user.
3. Open Dashboard to see board confidence, objectives, alerts and recommended next actions.
4. Open Board to inspect season objectives, job security, sack risk and review history.
5. Go to Squad to inspect your generated players.
6. Go to Training, choose a focus and run one training session for the current round.
7. Go to Fitness to inspect fatigue, morale and injuries after simulated rounds.
8. Go to Transfers to scout free agents, buy players or sell from your squad.
9. Go to Finance to inspect cash balance, wages and income after simulated rounds.
10. Go to Academy to scout junior prospects, upgrade the academy or promote players to the first team.
11. Go to Seasons to inspect career history or start a new season after the current one is complete.
12. Go to Cup to simulate the knockout cup bracket separately from the league.
13. Go to Tactics and change formation, mentality or pressing.
14. Click `Simuleaza etapa` to play the next league round.
15. Check Program, Meci curent and Clasament.
16. Save locally or save to Supabase; both are scoped to the authenticated user.
17. Open QA Live for deploy smoke tests.
18. Open Admin to validate payload integrity or generate a debug export.

## Supabase setup

1. Create a Supabase project.
2. In Authentication, keep email/password enabled.
3. Open Supabase SQL Editor.
4. Run the SQL file from:

```txt
supabase/schema.sql
```

5. Add these environment variables locally in `.env` or in Netlify Environment Variables:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

6. Redeploy Netlify.

The app uses Supabase Auth REST endpoints and the authenticated access token for saving/loading. The `manager_saves.manager_id` value is always the current `user.id`, and RLS allows each user to access only their own row. The club profile is stored in `payload.clubProfile`.

## Project structure

```txt
src/
  App.tsx
  main.tsx
  styles.css
  engine/
    types.ts
    random.ts
    teamStrength.ts
    playerStatus.ts
    training.ts
    transferMarket.ts
    finance.ts
    matchEngine.ts
    fixtureGenerator.ts
    standings.ts
    leagueSimulation.ts
    mockData.ts
    testSimulation.ts
    simulationBatchTest.ts
    testSeason.ts
    testPlayerStatus.ts
    testTransferMarket.ts
    testFinance.ts
    youthAcademy.ts
    testYouthAcademy.ts
    seasonProgression.ts
    testSeasonProgression.ts
    managerDashboard.ts
    testManagerDashboard.ts
    boardObjectives.ts
    testBoardObjectives.ts
  lib/
    authService.ts
    saveService.ts
supabase/
  schema.sql
```

## Next planned steps

1. Add manual starting XI selection.
2. Add stadium upgrades and sponsor choices.
3. Add richer youth potential growth across seasons.
4. Add richer board meetings, press/news feed and fan reactions.
5. Move official match simulation server-side for anti-cheat.

## Netlify fast build mode

This version uses the normal Netlify build command:

```bash
npm run build
```

The archive intentionally does not include `node_modules`, `dist`, `.git`, `.vite` or `package-lock.json`.

## v1.9.0 - UI/UX Polish Major + Help Center

This version adds a Help tab and onboarding checklist so a new manager can understand the intended gameplay loop directly inside the app.

New script:

```bash
npm run ux
```


## v2.0.0 - Public Beta Readiness

This version prepares the prototype for a first public/closed beta. It adds a Beta tab inside the app and a deterministic readiness engine that checks the most important release risks before you invite testers.

Included in this release:

- Beta readiness score from 0 to 100.
- Blockers, warnings and passed checks.
- Setup checks for Supabase Auth, Netlify env vars and save/load safety.
- Gameplay checks for match loop, squad depth, finance, board pressure, player availability and multi-season flow.
- Deploy checklist directly inside the app.
- `PUBLIC_BETA_CHECKLIST.md` with manual smoke-test steps.
- New script: `npm run beta`.

Recommended manual smoke test before sharing the beta link:

1. Deploy to Netlify with the existing `netlify.toml`.
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Netlify environment variables.
3. Run `supabase/schema.sql` in Supabase SQL Editor.
4. Register a fresh test user.
5. Create a club.
6. Save locally.
7. Save to Supabase.
8. Simulate one league round.
9. Open Match, Board, Finance and Beta.
10. Reload the page and load from Supabase.

## v2.1.0 — Live Deploy & QA Stabilization

This version adds a `QA Live` tab for real Netlify + Supabase testing. It includes health checks, smoke test progress, reset actions, Supabase save delete, and a debug packet that can be copied into bug reports.

New files:

- `src/engine/liveDeployQa.ts`
- `src/engine/testLiveDeployQa.ts`
- `LIVE_DEPLOY_QA.md`

New script:

```bash
npm run qa
```

Recommended deploy flow: run `supabase/schema.sql`, set Netlify env vars, deploy with `npm run build` / `dist`, then complete the checklist from the `QA Live` tab.


## v2.2.0 - Admin / Debug Panel

Goal: make live debugging safer and faster after the QA stabilization release.

Added:

- Admin tab with deterministic diagnostic score.
- Save-payload validation by restoring the payload in memory.
- Debug export JSON without password or Supabase access token.
- Save facts: app version, manager ID, season, round, payload size, squad, finances and feature history.
- Admin checks for auth context, Supabase context, save availability, squad integrity, league data, season state, finance state and last UI error.
- New pure engine helper: `src/engine/adminDebug.ts`.
- New verification script: `npm run admin`.
- New document: `ADMIN_DEBUG.md`.
