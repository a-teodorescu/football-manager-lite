# v2.4.0 — News Inbox / Manager Messages

This version adds an in-game manager inbox. It gives the user a lightweight news feed without adding any backend table or heavy dependency.

## What is included

- New `Inbox` tab.
- Saved `inboxMessages` in the existing manager save payload.
- Welcome messages when a club/career is created.
- Automatic messages for:
  - league rounds;
  - finance reports;
  - injuries/medical status;
  - board reviews;
  - transfers;
  - scouting reports;
  - academy actions;
  - contract actions;
  - cup rounds;
  - season transitions;
  - manual club snapshots.
- Read/unread state.
- Mark one message as read.
- Mark all messages as read.
- Inbox summary: total, unread, urgent, category counts.

## Design notes

The inbox is intentionally stored inside the current save payload. This keeps Supabase simple and preserves the single-table `manager_saves` model.

Messages are capped by `addInboxMessages` to avoid payload bloat and keep Netlify/localStorage/Supabase usage fast.

## QA

Run:

```bash
npm run inbox
npm run check
npm run build
```
