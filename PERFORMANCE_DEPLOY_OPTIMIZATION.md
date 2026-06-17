# v4.1.0 - Performance & Deploy Optimization

This release focuses on keeping the Netlify beta deploy fast after the v4.0 feature set increased the UI and engine surface area.

## What changed

- Vite now uses manual chunks for:
  - `vendor-react`
  - `engine`
  - `services`
  - the main app shell
- Production sourcemaps are disabled for smaller beta deploy artifacts.
- A new **Performance** tab explains build health, chunk plan, Netlify settings and QA commands.
- A new `npm run performance` script validates the deploy profile.
- `npm run fullcheck` now includes the performance/deploy test.

## Netlify profile

Keep the deploy settings simple:

```txt
Build command: npm run build
Publish directory: dist
NODE_VERSION=20
NPM_CONFIG_PRODUCTION=false
NPM_FLAGS=--include=dev
```

Do not add custom reinstall-heavy build commands.

## ZIP hygiene

Generated handoff ZIPs must not include:

- `node_modules`
- `dist`
- `.git`
- `.vite`
- `package-lock.json`

## QA commands

Run before handing off a ZIP:

```bash
npm run check
npm run build
npm run fullcheck
npm run performance
```

## v4.2.0 follow-up

The performance chunking profile from v4.1 remains active. v4.2 adds PWA files under `public/`, which Vite copies directly to `dist/` without changing the Netlify build command or adding dependencies.
