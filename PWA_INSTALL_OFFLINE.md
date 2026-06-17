# v4.2.0 — PWA / Offline Install & Mobile App Feel

This release makes Football Manager Lite installable as a lightweight PWA without adding any runtime dependency.

## What changed

- Added `public/manifest.webmanifest`.
- Added `public/sw.js` with a small versioned cache.
- Added `public/offline.html` fallback page.
- Added local SVG icon assets in `public/icons/`.
- Added service worker registration in `src/main.tsx`.
- Added a new **PWA** tab in the app.
- Added `src/engine/pwaInstall.ts` and `npm run pwa`.

## Netlify setup

No extra build command is required.

Use the same deploy profile:

```text
Build command: npm run build
Publish directory: dist
NODE_VERSION=20
NPM_CONFIG_PRODUCTION=false
NPM_FLAGS=--include=dev
```

Vite automatically copies everything from `public/` into `dist/`.

## Mobile test flow

1. Deploy to Netlify.
2. Open the live HTTPS URL on a phone.
3. Register/login.
4. Save locally once.
5. Use browser install flow:
   - Chrome/Android: Install app / Add to Home Screen.
   - Safari/iOS: Share -> Add to Home Screen.
6. Open the installed app from the home screen.
7. Turn off internet and reload.
8. Confirm the offline fallback appears or the cached shell loads.

## Important limitation

Offline mode protects the app shell and local save fallback. Supabase Auth and Supabase cloud save still require internet.
