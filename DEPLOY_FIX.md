# Deploy fix - public npm registry

This package is a clean deploy-ready build of v4.9.0.

Fixes included:
- `package-lock.json` no longer points to the internal OpenAI/Artifactory npm registry.
- `.npmrc` forces the public npm registry: `https://registry.npmjs.org/`.
- `node_modules/` and `dist/` are excluded from the zip and should not be committed.
- `netlify.toml` keeps `npm run build` and publishes `dist`.

Upload/commit only the source files, not `node_modules` or `dist`.

Recommended Netlify environment variable if the deploy still uses the wrong registry:

```text
NPM_CONFIG_REGISTRY=https://registry.npmjs.org/
```

Recommended local verification:

```bash
rm -rf node_modules dist
npm install
npm run check
npm run navigation
npm run fullcheck
npm run build
```
