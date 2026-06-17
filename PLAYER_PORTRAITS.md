# v3.8.0 — Player Portraits / Pixel Avatars

This release adds deterministic SVG pixel portraits for players.

## Goals

- No AI/API call per player.
- No new dependency.
- No binary image files in the repo.
- Fast Netlify build remains unchanged.
- Portraits are regenerated from player data and club colors, so the Supabase JSON payload stays small.

## How portraits work

`src/engine/playerPortraits.ts` builds each portrait from:

- `player.id` / `avatarSeed`
- player nationality
- player position
- player age
- morale/form/personality
- marketability/overall
- club primary and secondary colors

The result is an SVG data URI rendered by the React UI.

## UI

A new **Portraits** tab shows:

- portrait gallery
- frame type: Captain, Star, Academy, First Team
- player mood: Calm, Focused, Confident, Intense
- full squad portrait table

The **Players** tab also shows portrait thumbnails next to player profiles.

## QA

Run:

```bash
npm run portraits
npm run fullcheck
```
