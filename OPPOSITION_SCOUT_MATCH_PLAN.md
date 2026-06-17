# Opposition Scout & Match Plan

Version: `4.7.0`

This release adds a pre-match preparation layer before simulating the next league round.

## What it does

- finds the next official fixture involving the user club
- detects whether the user plays home or away
- identifies the opponent tactic through the existing AI team tactic system
- compares user strength vs opponent strength using the advanced tactic strength model
- highlights tactical threats and opportunities
- recommends a match plan with concrete tactic changes
- provides a preparation checklist for lineup, substitutions, set pieces, fitness and injuries
- lets the manager apply the recommended plan from the Match Prep tab

## One-click plan application

When the manager clicks **Apply recommended plan**, the app:

1. updates `game.userTactic` with the recommended tactic
2. auto-picks a compatible starting XI for the recommended formation
3. auto-picks set-piece specialists for that formation
4. keeps all existing save/load behavior intact

The feature does not require a save schema bump because it stores no new mandatory persistent object. It uses the existing tactic, lineup and set-piece fields.

## Engine module

New files:

- `src/engine/oppositionScout.ts`
- `src/engine/testOppositionScout.ts`

New npm script:

```bash
npm run opposition
```

## Deterministic logic

The report is deterministic for the same game state. It uses:

- next user fixture
- user tactic
- opponent tactic
- team strengths
- venue
- average fitness
- lineup validation
- substitution report
- set-piece report

## Recommended next steps

Good follow-up versions:

- v4.8: in-match tactical changes / half-time team talk
- v4.8: chemistry and dressing room dynamics
- v4.8: opponent-specific training session
