# League Expansion v2.3.0

This release adds a lightweight but meaningful league identity layer.

## What changed

- New `League` tab in the app.
- New engine helper: `src/engine/leagueExpansion.ts`.
- New verification script: `npm run league`.
- Team metadata added to the existing `Team` type:
  - short name;
  - city;
  - stadium;
  - country;
  - primary/secondary colors;
  - tactical style;
  - ambition;
  - rival team;
  - fanbase.

## Why this matters

Until now the league was functional, but most clubs behaved like generic mock teams. The new identity layer makes the league easier to understand and more enjoyable to test.

The user can now inspect:

- title race summary;
- pressure zone summary;
- fixture of the week;
- rivalries;
- club styles and ambitions.

## AI tactical diversity

AI tactics can be derived from club identity:

- `pressing` -> 4-3-3, attacking, high press;
- `possession` -> 4-2-3-1, balanced, medium press;
- `counter` -> 5-3-2, defensive, medium press;
- `defensive` -> 5-3-2, defensive, low press;
- `direct` -> 4-4-2, attacking, high press;
- `balanced` -> 4-2-3-1, balanced, medium press.

The user club still uses the tactic selected by the player.

## Save compatibility

The metadata is optional on `Team`, so old saves still load. When possible, teams are normalized through `applyTeamIdentity` to enrich old teams with the new identity metadata.

## Future upgrades

Good next steps:

1. editable league setup;
2. more teams/divisions;
3. promotion/relegation;
4. regional fan reactions;
5. news inbox based on rivalries and fixture of the week.
