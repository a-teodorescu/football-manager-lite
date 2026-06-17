# v4.8.0 - Career Trophy Room / Career Legacy

This release adds a career-level layer above the already existing league, cup, Europe, records and player awards modules.

## New tab

A new **Trophy Room** tab was added to the main navigation.

It shows:

- career score out of 100;
- total trophies;
- closed season count;
- best league finish;
- highest points total;
- current-season progress;
- total career prize money;
- biggest current-season win;
- league title count;
- domestic cup count;
- European trophy count;
- top-three finish count;
- career timeline;
- legacy milestone checklist;
- Hall of Fame watchlist.

## New engine module

New file:

```txt
src/engine/careerTrophyRoom.ts
```

The module exposes:

```ts
buildCareerTrophyRoomReport(...)
```

The report is derived from existing game data:

- `seasonHistory`
- `cupHistory`
- `europeanHistory`
- `standings`
- `results`
- `playerStatsAwards.stats`
- current user team

## Save compatibility

No save schema bump was required.

The feature does not add new persistent fields. It calculates the Trophy Room from data already saved in the manager payload.

Current save schema remains:

```txt
46
```

## Trophies counted

The Trophy Room currently counts:

- league titles when the user club is champion in a closed season;
- domestic cup wins when the user advanced in a final record;
- European trophy wins when the user advanced in a European final record;
- top-three league finishes from closed seasons.

## Career score

The career score is a lightweight legacy score based on:

- trophy count;
- top-three finishes;
- closed seasons;
- best league finish.

It is intentionally simple and deterministic, so it can be expanded later without breaking saves.

## Hall of Fame watchlist

The Hall of Fame watchlist uses the existing player stats report and ranks players by:

- average rating;
- goals;
- market value;
- appearances.

It assigns simple tags such as:

- Club icon
- Goal machine
- Future legend
- Reliable leader
- Squad pillar

## QA

New script:

```bash
npm run career
```

Also included in:

```bash
npm run fullcheck
```

Recommended validation:

```bash
npm run check
npm run career
npm run fullcheck
npm run build
```
