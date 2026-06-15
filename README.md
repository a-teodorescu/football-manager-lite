# Football Manager Lite

Primul prototip pentru un browser/mobile football management simulator.

Proiectul contine:

- match engine determinist in TypeScript;
- simulator de meci in browser cu React + Vite;
- script CLI pentru un meci simplu;
- script CLI pentru batch test pe 1000 de meciuri;
- configuratie Netlify.

## Rulare locala

```bash
npm install
npm run dev
```

Apoi deschide URL-ul afisat in terminal, de obicei:

```bash
http://localhost:5173
```

## Rulare engine in terminal

Un meci simplu:

```bash
npm run simulate
```

Batch test:

```bash
npm run batch
```

## Build pentru productie

```bash
npm run build
npm run preview
```

## Deploy pe Netlify

Setarile sunt deja incluse in `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"
```

Pasi:

1. Creeaza un repository nou pe GitHub.
2. Urca fisierele din acest proiect.
3. In Netlify: Add new project > Import from Git.
4. Alege repository-ul.
5. Netlify ar trebui sa detecteze Vite automat.
6. Build command: `npm run build`.
7. Publish directory: `dist`.
8. Deploy.

## Structura principala

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
    mockData.ts
    testSimulation.ts
    simulationBatchTest.ts
```

## Observatie importanta

Momentan engine-ul ruleaza in browser pentru demo. Mai tarziu, pentru varianta reala cu useri, rezultate si anti-cheat, simularea meciurilor trebuie mutata server-side, in Supabase Edge Functions sau Netlify Functions.
