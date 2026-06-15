# Football Manager Lite

Browser/mobile football management simulator prototype.

Current version: `0.3.0`

## What is included now

- React + Vite browser interface
- Deterministic TypeScript match engine
- One-match simulation
- Full league simulation in browser
- 8 mock teams
- 14 rounds
- 56 fixtures
- automatic standings
- match report with stats and timeline
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

## Useful scripts

```bash
npm run dev       # start browser app locally
npm run build     # production build
npm run simulate  # simulate one match in terminal
npm run batch     # run 1000 match simulations in terminal
npm run season    # simulate a full season in terminal
npm run check     # TypeScript check
```

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
```

## Next planned steps

1. Add club creation screen.
2. Add squad page.
3. Add tactics page.
4. Allow the user to change formation, mentality and pressing before simulation.
5. Move persistent data to Supabase.
6. Later, move official match simulation server-side for anti-cheat.
