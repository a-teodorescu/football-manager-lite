# v4.6.0 - Set Pieces & Captain

This increment adds a dedicated set-piece management layer on top of v4.4 manual lineups and v4.5 substitutions.

## Added

- New `Set Pieces` tab in the browser UI.
- Captain, penalty taker, free-kick taker, left-corner taker and right-corner taker assignments.
- Auto-pick logic based on role-specific scoring.
- Assignment validation with warnings when a specialist is not in the starting XI.
- `Team.setPieceAssignments` saved in the normal save payload.
- Match engine support for deterministic set-piece events.
- Free kicks can generate direct shots/goals.
- Corners can generate assisted chances and goals.
- If a specialist is not active on the pitch after substitutions, the engine automatically picks the best available active player for that role.
- New QA script: `npm run setpieces`.
- Save schema updated to `46`.

## Role scoring

The role score uses different weights depending on the responsibility:

- Captain: overall, morale, form, age and personality.
- Penalty taker: shooting, morale, form and attacking position fit.
- Free kicks: shooting, passing, form and attacking/midfield fit.
- Corners: passing, stamina, form, preferred foot and midfield/attacking fit.

## Match engine impact

Set pieces are not cosmetic. During a match:

- Fouls can create dangerous free-kick attacks.
- Open-play pressure can create corner attacks.
- Set-piece specialists influence xG, shot-on-target probability and goal probability.
- Set-piece events appear in the match timeline with the new `set_piece` event type.
- Goals from free kicks and corners appear as normal `goal` events with set-piece text.

## Validation

Run:

```bash
npm run check
npm run setpieces
npm run fullcheck
npm run build
```
