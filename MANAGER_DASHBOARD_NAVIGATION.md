# v4.9.0 — Manager Dashboard & Navigation Polish

This release improves usability after the project accumulated many gameplay modules.
The goal is not to add another isolated feature, but to make the existing career easier to navigate on browser and mobile.

## Added

- Grouped navigation instead of one long flat tab row.
- Six navigation groups:
  - Home
  - Club
  - Matchday
  - Season
  - Business
  - Online & QA
- Europe is now visible in the grouped Season navigation.
- Manager Hub card inside Dashboard.
- Match readiness score from:
  - starting XI validity
  - substitution plan validity
  - set-piece assignments
  - current-round training status
  - next-opponent scouting availability
- Quick actions ordered by priority.
- Dashboard checklist with direct buttons to the relevant tab.
- Mobile-friendly grouped tab layout.

## Engine module

New module:

```txt
src/engine/managerNavigation.ts
```

It exposes:

```ts
buildManagerNavigationReport(input)
MANAGER_NAVIGATION_GROUPS
```

The module does not mutate game state. It reads existing data and builds a UI/navigation report.

## Test

New test:

```bash
npm run navigation
```

It validates:

- grouped navigation exists
- the tab count is complete
- the Europe tab is exposed
- mobile primary tabs exist
- match readiness is within valid range
- quick actions are generated

## Compatibility

`SAVE_SCHEMA_VERSION` was not increased.

Reason: this release does not add new persistent data. It derives the dashboard/navigation state from existing save fields.

## Verification

Run:

```bash
npm run check
npm run navigation
npm run dashboard
npm run fullcheck
npm run build
```
