# v4.4.0 - Manual Lineup Selection

This release adds the first manual starting XI layer.

## What changed

- New `Lineup` tab in the app.
- New engine helper: `src/engine/lineupSelection.ts`.
- New verification script: `npm run lineup`.
- The user team can store `lineupPlayerIds` directly on the `Team` payload.
- The selected first XI is persisted through local/Supabase saves because it is part of `teams`.
- Future fixtures are hydrated with the updated user team after every lineup edit.

## Gameplay impact

The match engine now uses the selected starting XI when calculating:

- team strength;
- attacking/defensive balance;
- shots;
- goals;
- cards;
- player names shown in match events.

If no manual lineup exists yet, the app auto-picks a valid XI based on:

- formation;
- player position;
- overall;
- form;
- morale;
- fitness;
- injury risk.

## Formation slots

- `4-4-2`: 1 GK, 4 DEF, 4 MID, 2 ATT
- `4-3-3`: 1 GK, 4 DEF, 3 MID, 3 ATT
- `4-2-3-1`: 1 GK, 4 DEF, 4 MID, 2 ATT
- `5-3-2`: 1 GK, 5 DEF, 3 MID, 2 ATT

## QA

Run:

```bash
npm run lineup
npm run fullcheck
npm run check
npm run build
```

The lineup test verifies that:

- auto-pick creates 11 unique starters;
- validation catches incomplete lineups;
- team strength is calculated from the lineup;
- match events for the user team come only from selected starters.
