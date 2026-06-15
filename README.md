# Football Manager Lite

Browser/mobile football management simulator prototype.

Current version: `0.4.0`

## What is included now

- React + Vite browser interface
- Deterministic TypeScript match engine
- 8 mock teams
- 14 rounds
- 56 fixtures
- round-by-round simulation
- Squad tab for the user's club
- Tactics tab with formation, mentality and pressing
- user tactic affects future FC Bucuresti matches
- standings update after every simulated round
- match report with stats and timeline
- local save/load with LocalStorage
- optional Supabase save/load using REST API
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

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Netlify settings:

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
npm run check     # TypeScript check
```

## Browser flow

1. Open Dashboard.
2. Go to Squad to inspect FC Bucuresti players.
3. Go to Tactics and change formation, mentality or pressing.
4. Click `Simuleaza etapa` to play the next round.
5. Check Program, Meci curent and Clasament.
6. Use local save/load or configure Supabase for cloud save.

## Supabase save setup

LocalStorage works immediately. Supabase is optional.

1. Create a Supabase project.
2. Open Supabase SQL Editor.
3. Run the SQL file from:

```txt
supabase/schema.sql
```

4. Add these environment variables locally in `.env` or in Netlify Environment Variables:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

5. Redeploy Netlify.

Current Supabase save is intentionally simple and uses a demo manager id:

```txt
local-demo-manager
```

Later, when we add Supabase Auth, this will become one save per authenticated user.

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
    matchEngine.ts
    fixtureGenerator.ts
    standings.ts
    leagueSimulation.ts
    mockData.ts
    testSimulation.ts
    simulationBatchTest.ts
    testSeason.ts
  lib/
    saveService.ts
supabase/
  schema.sql
```

## Next planned steps

1. Add real club creation screen.
2. Add manual starting XI selection.
3. Add player development and morale changes after matches.
4. Add injuries and suspensions.
5. Move official match simulation server-side for anti-cheat.


## Netlify install fix

This archive intentionally does not include `package-lock.json`. The previous lockfile was generated in a restricted environment and could cause Netlify npm installs to fail with missing CLI binaries such as `vite: not found`. Netlify should generate a fresh lock/install from the public npm registry.

Committed `.npmrc` forces the public npm registry:

```txt
registry=https://registry.npmjs.org/
fund=false
audit=false
```

If Netlify still uses a cached broken install, run: Deploys -> Trigger deploy -> Clear cache and deploy site.
