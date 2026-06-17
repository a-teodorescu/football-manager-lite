# v3.4.0 Stabilizare, Refactor & Game Quality Pass

Acest release nu adauga un feature mare de gameplay. Scopul este sa faca proiectul mai sigur pentru iteratii viitoare.

## Ce include

- `src/lib/saveMigration.ts` cu `SAVE_SCHEMA_VERSION = 34`.
- Migrare automata pentru salvarile incarcate din localStorage si Supabase.
- `src/components/ErrorBoundary.tsx` pentru recovery cand UI-ul prinde o eroare React.
- Tab nou `Stability` in aplicatie.
- Re-exporturi de tipuri in `src/types/` pentru o centralizare graduala.
- Script nou `npm run fullcheck` care ruleaza toate verificarile importante.
- Scripturi noi:
  - `npm run migration`
  - `npm run stabilization`

## Regula pentru save-uri

Orice payload vechi este trecut prin:

```ts
migrateSavePayload(payload, userId)
```

Migrarea face urmatoarele lucruri:

- seteaza `version` la schema curenta;
- pastreaza `managerId` daca exista;
- foloseste `userId` autentificat ca fallback;
- normalizeaza `seasonNumber`, `currentRound`, `clubProfile`, `userTactic`;
- reface date de baza daca lipsesc `teams`, `fixtures` sau `standings`.

## Regula pentru release

Inainte de orice ZIP nou, ruleaza:

```bash
npm run fullcheck
```

Apoi creeaza arhiva fara:

- `node_modules`
- `dist`
- `.git`
- `.vite`
- `package-lock.json`

## Refactor plan sigur

`src/App.tsx` este inca mare. Pentru a nu rupe jocul, refactorul UI trebuie facut gradual:

1. extrage doar componente stateless;
2. pastreaza state-ul principal in `App.tsx`;
3. muta un singur tab per release;
4. ruleaza `npm run fullcheck` dupa fiecare tab mutat;
5. abia dupa stabilizare, muta logica de actiuni in custom hooks.

Primele tinte recomandate:

- `src/components/tabs/StabilityTab.tsx`
- `src/components/tabs/AdminTab.tsx`
- `src/components/tabs/QaLiveTab.tsx`
- `src/components/tabs/HelpTab.tsx`

## Balance pass inclus

Nu au fost schimbate agresiv valorile economice. v3.4 adauga doar un cadru mai bun de raportare si verificare. Urmatorul balance pass poate modifica efectiv salarii, venituri, risc accidentari si presiune board dupa testare live.


## v3.5.0 - Real Database Mode

Adds optional Supabase relational mirror tables while keeping `manager_saves.payload` as the canonical fallback. New files: `REAL_DATABASE_MODE.md`, `src/engine/realDatabaseMode.ts`, `src/lib/realDatabaseService.ts`, and `src/engine/testRealDatabaseMode.ts`. Run `npm run database` or `npm run fullcheck`.
