# Football Manager Lite

Browser/mobile football management simulator prototype.

Current version: `0.6.0`

## What is included now

- React + Vite browser interface
- Deterministic TypeScript match engine
- Supabase Auth with email/password register, login and logout
- Per-user saves using Supabase Auth `user.id`
- Real club creation flow after register/login
- User club name, city and colors stored in the save payload
- 8 mock teams
- 14 rounds
- 56 fixtures
- round-by-round simulation
- Squad tab for the user's club
- Tactics tab with formation, mentality and pressing
- user tactic affects future matches for the created club
- standings update after every simulated round
- match report with stats and timeline
- local save/load scoped per authenticated user
- Supabase save/load scoped per authenticated user with RLS
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
npm run check     # TypeScript check
```

## Browser flow

1. Register or login with email/password.
2. Open Dashboard.
3. Create your club name, city and colors if this is a new user.
4. Go to Squad to inspect your generated players.
5. Go to Tactics and change formation, mentality or pressing.
6. Click `Simuleaza etapa` to play the next round.
7. Check Program, Meci curent and Clasament.
8. Save locally or save to Supabase; both are scoped to the authenticated user.

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
    matchEngine.ts
    fixtureGenerator.ts
    standings.ts
    leagueSimulation.ts
    mockData.ts
    testSimulation.ts
    simulationBatchTest.ts
    testSeason.ts
  lib/
    authService.ts
    saveService.ts
supabase/
  schema.sql
```

## Next planned steps

1. Add manual starting XI selection.
3. Add player development and morale changes after matches.
4. Add injuries and suspensions.
5. Move official match simulation server-side for anti-cheat.

## Netlify fast build mode

This version uses the normal Netlify build command:

```bash
npm run build
```

The archive intentionally does not include `node_modules`, `dist`, `.git`, `.vite` or `package-lock.json`.
