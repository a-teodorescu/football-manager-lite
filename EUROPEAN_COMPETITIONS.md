# v3.7.0 — European Cups / International Competitions

This release adds a lightweight European competition layer on top of the existing league and cup systems.

## Main goals

- Keep the deterministic TypeScript engine approach.
- Avoid replacing the current JSON save fallback.
- Add a separate continental competition that can be simulated from the UI.
- Connect European progression with finance, player status and inbox-style reporting.

## Gameplay

The new European competition has four stages:

1. Playoff european
2. Grupa europeana
3. Semifinale europene
4. Finala europeana

The competition field includes the user's club plus generated European opponents. Each round is deterministic and can be simulated from the new **Europe** tab.

## Rewards

The user's club receives prize money depending on participation and progression. The prize is added to cash balance when the round is simulated.

## Save/load

The state is stored in the existing save payload:

- `europeanState`
- `europeanHistory`

Old saves are migrated automatically by `saveMigration.ts`.

## Scripts

```bash
npm run europe
npm run fullcheck
```
