# Admin / Debug Panel

Version `2.2.0` adds an in-game Admin tab for controlled live testing.

The Admin tab is intentionally a QA/debug layer. It does not change match results, team strength, fixtures, standings, transfers, finance, board objectives, or season progression by itself.

## What it checks

- active Supabase Auth context and manager ID;
- Supabase environment configuration signal;
- local/cloud save availability;
- estimated save payload size;
- squad integrity and unavailable players;
- league data integrity: teams, fixtures, standings;
- season state;
- finance state and wage budget pressure;
- feature history signals for training, transfers, finance and board reviews;
- last visible UI error.

## Admin actions

- validate the current save payload by restoring it in memory;
- generate a debug export as JSON;
- copy the export to clipboard when browser permissions allow it;
- force local save;
- force board review.

## Privacy / safety

The debug export includes career state and diagnostic metadata. It does not include the user's password or Supabase access token. It can still include the authenticated user email and manager ID, so treat it as private debugging material.

## Recommended live QA flow

1. Open QA Live and run the smoke test checklist.
2. Open Admin.
3. Click `Valideaza payload`.
4. Click `Genereaza export debug`.
5. Copy the export only if you need to investigate a live bug.
6. Verify the Admin score is healthy before inviting external testers.
