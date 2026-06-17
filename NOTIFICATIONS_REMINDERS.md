# v4.3.0 - Notifications & Reminders

This release adds a lightweight Notification Center for the PWA/mobile beta.

## What it does

- Adds a new `Notifications` tab.
- Tracks browser notification permission.
- Keeps in-app reminders available even when browser notifications are blocked.
- Adds reminders for:
  - saving the career;
  - training before the current round;
  - matchday preparation;
  - medical/fitness risk;
  - expiring contracts;
  - board pressure;
  - unread Inbox messages.
- Adds archived reminders to the save payload.
- Adds save schema version `43`.

## Browser notifications

Browser notifications are optional. They require:

1. HTTPS deploy, for example Netlify.
2. Browser support for the Notification API.
3. User permission.
4. For best mobile behavior, install the PWA first.

## QA

Run:

```bash
npm run check
npm run build
npm run notifications
npm run fullcheck
```

No external notification service is used. No new package dependency is required.
