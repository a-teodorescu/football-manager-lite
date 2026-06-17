# v4.5.0 - Substitutions & Bench Impact

This release adds a lightweight substitution planning layer without changing the Netlify/Supabase architecture.

## What changed

- New `Subs` tab in the main UI.
- Up to 3 planned substitutions per match.
- Auto-pick substitution plan based on:
  - starting XI;
  - bench options;
  - position fit;
  - player fitness;
  - stamina;
  - injury status;
  - form and morale.
- Manual substitution form: player out, player in, minute.
- Bench strength and expected impact metrics.
- Save-compatible `Team.substitutionPlan` field.
- Match engine now creates `substitution` timeline events.
- Active lineup changes after the planned minute, so substitutes can later appear in shots, goals and card events.

## Engine files

- `src/engine/substitutions.ts`
- `src/engine/testSubstitutions.ts`
- updated `src/engine/matchEngine.ts`
- updated `src/engine/types.ts`
- updated `src/App.tsx`

## QA

Run:

```bash
npm run substitutions
npm run fullcheck
npm run check
npm run build
```

Expected result: all commands pass.

## Save compatibility

The feature stores the substitution plan inside the existing `teams` payload as optional `Team.substitutionPlan`. Older saves remain valid because the field is optional and empty by default.
