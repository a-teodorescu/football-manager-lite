# Football Manager Lite

Browser/mobile football management simulator prototype.

Current version: `4.9.0`

## What is included now

- React + Vite browser interface
- Manual Lineup tab with starting XI selection, auto-pick and lineup validation
- Subs tab with substitution planning, bench impact recommendations and second-half changes
- Set Pieces tab with captain, penalty, free-kick and corner specialists
- Match Prep tab with opposition scout report, tactical threats, opportunities, checklist and one-click recommended match plan
- Trophy Room tab with career score, trophies, all-time records, legacy timeline, milestones and Hall of Fame watchlist
- Grouped navigation with Home, Club, Matchday, Season, Business and Online/QA sections
- Manager Hub inside Dashboard with match readiness score, quick actions and pre-match checklist
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
- Finance tab with cash balance, wage bill, wage budget, sponsor income, matchday income, facilities income/maintenance and round financial reports
- Youth Academy tab with deterministic prospects, scouting, academy upgrades and promotion to first team
- Academy upkeep cost integrated into round finance reports
- Seasons tab with multi-season progression, prize money and historical season summaries
- Career legacy layer derived from league history, cup history, European campaigns and player records
- Manager Dashboard with board confidence, objective scores, alerts, key players and recommended next actions
- Board objectives are evaluated after league rounds, cup rounds and manual board review
- Matchday Experience with match preview, tactical recommendation, post-match analysis, Man of the Match and player ratings
- Contracts tab with contract expiry, wage demands, renewals, releases and contract history
- Mobile UI polish for dashboard cards, objectives, matchday cards and horizontal tab navigation
- New season flow keeps the user squad, ages players, resets injuries, processes expired contracts, regenerates fixtures and resets standings
- User club name, city and colors stored in the save payload
- 8 identity-driven league teams
- 14 rounds
- 56 fixtures
- round-by-round simulation
- Squad tab for the user's club
- Tactics tab with formation, mentality and pressing
- user tactic affects future matches for the created club
- standings update after every simulated round
- match report with stats, timeline, half-time score, momentum, tactical feedback, substitutions, set-piece events and top performers
- opposition scout compares next opponent strength, style, tactic and venue before simulation
- cup rounds apply fitness, morale and injury effects without changing the league fixtures
- local save/load scoped per authenticated user
- Supabase save/load scoped per authenticated user with RLS
- Beta tab with public beta readiness score, blockers, warnings and deploy checklist
- QA Live tab with deploy health checks, reset actions and smoke test checklist
- Admin tab with save-payload validation, debug export and integrity checks
- League tab with club identities, rivalries, stadiums, AI tactical styles and fixture of the week
- Facilities tab with stadium capacity, fan experience, training ground, medical center, academy campus and commercial zone upgrades
- Public beta checklist document with smoke-test steps
- Performance tab with Vite chunking status, Netlify build profile and deploy optimization checks
- Vite manual chunks for React vendor, engine modules and services to avoid large bundle warnings
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

## v4.9 Manager navigation polish

Version `4.9.0` adds a grouped navigation layer and a Manager Hub in the dashboard.

Run the navigation test with:

```bash
npm run navigation
```

Details are documented in `MANAGER_DASHBOARD_NAVIGATION.md`.

## Performance build profile

Version `4.1.0` adds manual chunking in `vite.config.ts`:

- `vendor-react` for React runtime;
- `engine` for deterministic game engine modules;
- `services` for auth/save/database services;
- main app shell for UI.

Run the optimized deploy gate with:

```bash
npm run performance
npm run fullcheck
```

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
npm run league     # test league identity, rivalries and fixture of the week
npm run lineup     # test manual starting XI selection
npm run substitutions # test substitution planning and bench impact
npm run setpieces  # test captain, free-kick and corner assignments
npm run opposition # test opposition scout and recommended match plan
npm run career     # test career Trophy Room / legacy report
npm run check      # TypeScript check
```

## Browser flow

1. Register or login with email/password.
2. Create your club name, city and colors if this is a new user.
3. Open Dashboard to see board confidence, objectives, alerts and recommended next actions.
4. Open League to inspect club identities, rivalries and fixture of the week.
5. Open Board to inspect season objectives, job security, sack risk and review history.
6. Go to Squad to inspect your generated players.
7. Go to Lineup to choose or auto-pick your starting XI.
8. Go to Subs to plan up to 3 second-half substitutions.
9. Go to Set Pieces to choose the captain and dead-ball specialists.
10. Go to Training, choose a focus and run one training session for the current round.
11. Go to Fitness to inspect fatigue, morale and injuries after simulated rounds.
12. Go to Transfers to scout free agents, buy players or sell from your squad.
13. Go to Finance to inspect cash balance, wages and income after simulated rounds.
14. Go to Academy to scout junior prospects, upgrade the academy or promote players to the first team.
15. Go to Seasons to inspect career history or start a new season after the current one is complete.
16. Go to Trophy Room to inspect trophies, legacy milestones, timeline and Hall of Fame watchlist.
17. Go to Cup to simulate the knockout cup bracket separately from the league.
18. Go to Tactics and change formation, mentality or pressing.
19. Click `Simuleaza etapa` to play the next league round.
20. Check Program, Meci curent and Clasament.
21. Save locally or save to Supabase; both are scoped to the authenticated user.
22. Open QA Live for deploy smoke tests.
23. Open Admin to validate payload integrity or generate a debug export.

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
    leagueExpansion.ts
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

1. Add richer youth potential growth across seasons.
2. Add deeper in-match tactical reactions after goals/red cards.
3. Add richer board meetings, press/news feed and fan reactions.
4. Move official match simulation server-side for anti-cheat.
5. Add editable league setup and promotion/relegation.

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


## v2.3.0 - Realistic League Expansion

Goal: make the league feel less like generic mock data and more like a small playable football world.

Added:

- New League tab.
- Club identity metadata for every team: city, stadium, colors, short name, fanbase, ambition and rival club.
- AI tactical styles: possession, direct, counter, high press, defensive block and balanced.
- AI tactics can now be derived from team identity, while the user's club still uses the selected user tactic.
- Fixture of the week based on current round, table context, user involvement and derby/rivalry importance.
- Rivalry list with intensity score.
- League overview with title-race story, pressure-zone story and team tiers.
- New pure engine helper: `src/engine/leagueExpansion.ts`.
- New verification script: `npm run league`.
- New document: `LEAGUE_EXPANSION.md`.

## v2.4.0 — News Inbox / Manager Messages

- Adds a saved in-game Inbox tab for manager messages.
- Generates news for match rounds, finances, injuries, board reviews, transfers, scouting, academy actions, contracts, cup rounds and season transitions.
- Supports unread/read state, mark-all-read, category summary and manual club snapshot messages.
- Keeps the existing Supabase single-table save model by storing inbox messages inside the manager save payload.

## v2.5.0 Sponsorships

This version adds a `Sponsors` tab with commercial offers, active deals, signing bonuses and recurring sponsor income. Sponsor income is included in the existing Finance reports and sponsor events are also sent to the News Inbox.

New script:

```bash
npm run sponsorship
```

## v2.6.0 — Stadium & Facilities

This version adds a `Facilities` tab with stadium and infrastructure upgrades.

Added:

- Stadium capacity upgrades.
- Fan experience upgrades.
- Training ground upgrades with deterministic training bonus.
- Medical center infrastructure metric.
- Academy campus discount for academy upkeep.
- Commercial zone recurring income.
- Facility maintenance cost in Finance reports.
- Facility records in News Inbox.
- New pure engine helper: `src/engine/stadiumFacilities.ts`.
- New verification script: `npm run facilities`.
- New document: `STADIUM_FACILITIES.md`.


## v2.7.0 - Player Identity & Presentation

Adds richer player identity: nationality, flag, preferred foot, personality, player role, marketability, a new Players tab, and deterministic save-compatible normalization for older careers.

## v3.3.0 combined release

This release combines the requested roadmap items after v2.7:

- v2.8 Staff & Coaching Team
- v2.9 Player Stats, Records & Awards
- v3.0 Major Game Balance layer
- v3.1 Media / Press Conferences
- v3.2 Stadium Attendance & Fan Happiness
- v3.3 Difficulty Levels

New scripts:

```bash
npm run staff
npm run records
npm run balance
npm run media
npm run fans
```

## v3.4.0 - Stabilizare & QA

Release-ul v3.4.0 adauga save migration, ErrorBoundary recovery, tabul Stability, re-exporturi de tipuri in `src/types`, scripturile `npm run migration`, `npm run stabilization` si comanda completa `npm run fullcheck`. Detalii in `STABILIZATION_QA.md`.



## v3.5.0 - Real Database Mode

Adds optional Supabase relational mirror tables while keeping `manager_saves.payload` as the canonical fallback. New files: `REAL_DATABASE_MODE.md`, `src/engine/realDatabaseMode.ts`, `src/lib/realDatabaseService.ts`, and `src/engine/testRealDatabaseMode.ts`. Run `npm run database` or `npm run fullcheck`.

## v3.6.0 — Multiplayer / Friends League

Adds a lightweight friends league foundation. The app now has a **Multiplayer** tab with deterministic league codes, invite text, a shared leaderboard preview and Supabase table plans for friends league rooms, members and snapshots. JSON save remains the canonical fallback.


## v3.8.0 — Player Portraits / Pixel Avatars

Added deterministic SVG pixel portraits, a Portraits tab, portrait thumbnails in player identity views, and `npm run portraits`.

## v3.9.0 — Advanced Tactics

This version adds an Advanced Tactics tab with tempo, width, tactical risk, defensive line, attacking focus, role suitability, tactical score, risk warnings, and squad-based recommendations. Existing saves remain compatible because the advanced tactic values are optional and normalized with safe defaults.

## v4.0.0 — Beta Polish Release

- New Release tab with launch readiness score.
- Portable save JSON export.
- Copyable release notes for testers.
- `npm run release` added and included in `npm run fullcheck`.
- Save schema updated to `40`.



## v4.2.0 PWA / Offline Install

Version `4.2.0` adds a lightweight PWA layer: `manifest.webmanifest`, `sw.js`, `offline.html`, local SVG icon, service worker registration and the in-game **PWA** tab. It keeps the Netlify build command unchanged and does not add dependencies. Supabase cloud save still requires internet, while local save remains the safe offline/mobile fallback.


## v4.3.0 - Notifications & Reminders

Adds a Notification Center with browser permission status, in-app reminders, archived reminders in the save payload, and QA script `npm run notifications`.

## v4.4.0 - Manual Lineup Selection

Adds a `Lineup` tab with manual starting XI selection, formation-slot validation, auto-pick based on position/form/fitness, save-compatible `Team.lineupPlayerIds`, and QA script `npm run lineup`. Match simulation now uses the selected XI for strength and event player selection.

## v4.5.0 - Substitutions & Bench Impact

Adds a `Subs` tab with up to 3 planned substitutions, auto-pick recommendations, manual substitution selection, bench strength, expected impact, save-compatible `Team.substitutionPlan`, substitution timeline events, and QA script `npm run substitutions`. The match engine now updates active players after substitutions, so incoming players can participate in shots, goals and card events.


## v4.6.0 - Set Pieces & Captain

Adds a `Set Pieces` tab with captain, penalty taker, free-kick taker, left-corner taker and right-corner taker assignments. Auto-pick uses role-specific scoring from attributes, form, morale, personality, preferred foot and starting-XI status. The match engine now creates deterministic free-kick and corner events, uses the active specialist on the pitch, and falls back to the best remaining player after substitutions. QA script added: `npm run setpieces`. Save schema updated to `46`.

## v4.7.0 - Opposition Scout & Match Plan

Adds a Match Prep tab that analyzes the next user fixture, compares team strengths, opponent style, tactic and venue, then recommends a tactical match plan. The manager can apply the suggested plan with one click; it updates the existing tactic and regenerates lineup/set-piece selections for the new formation. No save-schema bump was required because the applied plan uses the existing `userTactic` and team fields.

Validation command:

```bash
npm run opposition
npm run check
npm run fullcheck
npm run build
```


## v4.8.0 - Career Trophy Room / Career Legacy

Adds a new **Trophy Room** tab with career score, trophy buckets, all-time record metrics, a legacy milestone checklist, a career timeline and a Hall of Fame watchlist. The feature is derived from existing `seasonHistory`, `cupHistory`, `europeanHistory`, match results and player stats, so no save-schema bump was required.

New files:

```txt
src/engine/careerTrophyRoom.ts
src/engine/testCareerTrophyRoom.ts
CAREER_TROPHY_ROOM.md
```

Validation command:

```bash
npm run career
npm run check
npm run fullcheck
npm run build
```
