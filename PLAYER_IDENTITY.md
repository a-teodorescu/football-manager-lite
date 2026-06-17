# Player Identity & Presentation

Version 2.7.0 adds a lightweight player identity layer without changing the core match engine architecture.

## What it adds

- Nationality, country code and flag for every generated player.
- Preferred foot: right, left or both.
- Personality: leader, professional, ambitious, loyal, temperamental or team player.
- Tactical role generated from position and attributes.
- Marketability score used for presentation and future commercial features.
- Player identity overview tab in the UI.

## Deterministic design

Identity is generated from stable seeds such as player id, season, round and index. The same generated player will keep the same identity across reloads and saves.

## Save compatibility

Older saves are normalized on load. If a player is missing nationality, preferred foot, role or marketability, the game fills those fields deterministically while preserving existing player names and stats.

## Files

- `src/engine/playerIdentity.ts`
- `src/engine/testPlayerIdentity.ts`
- `src/engine/types.ts`
- `src/App.tsx`
