export type PerformanceCheckStatus = "pass" | "warning" | "fail";

export interface PerformanceCheck {
  id: string;
  title: string;
  status: PerformanceCheckStatus;
  summary: string;
  action: string;
}

export interface PerformanceChunkPlan {
  name: string;
  purpose: string;
  expectedMaxKb: number;
}

export interface PerformanceDeployReport {
  score: number;
  statusLabel: string;
  passCount: number;
  warningCount: number;
  failCount: number;
  checks: PerformanceCheck[];
  chunkPlan: PerformanceChunkPlan[];
  netlifyBuildProfile: string[];
  recommendedCommands: string[];
  releaseNotes: string[];
}

function statusWeight(status: PerformanceCheckStatus): number {
  if (status === "pass") return 1;
  if (status === "warning") return 0.55;
  return 0;
}

function getStatusLabel(score: number, failCount: number, warningCount: number): string {
  if (failCount === 0 && score >= 88 && warningCount <= 1) return "Optimized for Netlify deploy";
  if (failCount === 0 && score >= 72) return "Deploy optimized with warnings";
  return "Needs performance cleanup";
}

export function buildPerformanceDeployReport(input: {
  appVersion: string;
  saveSchemaVersion: number;
  appEstimatedLines: number;
  totalTabs: number;
  engineModuleCount: number;
  buildUsesManualChunks: boolean;
  reactVendorChunk: boolean;
  engineChunk: boolean;
  servicesChunk: boolean;
  sourcemapDisabled: boolean;
  packageLockExcluded: boolean;
  nodeModulesExcluded: boolean;
  distExcluded: boolean;
  netlifyNodeVersion: string;
  netlifyBuildCommand: string;
  netlifyPublishDir: string;
  fullcheckAvailable: boolean;
  bundleWarningResolved: boolean;
}): PerformanceDeployReport {
  const checks: PerformanceCheck[] = [
    {
      id: "manual-chunks",
      title: "Vite manual chunks",
      status: input.buildUsesManualChunks && input.reactVendorChunk && input.engineChunk && input.servicesChunk ? "pass" : input.buildUsesManualChunks ? "warning" : "fail",
      summary: input.buildUsesManualChunks
        ? "Build is split into app, React vendor, engine and service chunks."
        : "Build still relies on one large default JS bundle.",
      action: "Keep manualChunks in vite.config.ts and avoid importing large optional modules directly into the app shell.",
    },
    {
      id: "bundle-warning",
      title: "Large chunk warning",
      status: input.bundleWarningResolved ? "pass" : "warning",
      summary: input.bundleWarningResolved
        ? "Production build no longer emits the >500 KB chunk warning."
        : "Production build still emits the >500 KB chunk warning.",
      action: "Run npm run build after every major feature pack and inspect dist/assets sizes.",
    },
    {
      id: "sourcemap",
      title: "Production sourcemaps",
      status: input.sourcemapDisabled ? "pass" : "warning",
      summary: input.sourcemapDisabled
        ? "Sourcemaps are disabled for smaller public beta deploy artifacts."
        : "Sourcemaps are enabled and may increase deploy size.",
      action: "Enable sourcemaps only when debugging production issues that cannot be reproduced locally.",
    },
    {
      id: "netlify-profile",
      title: "Netlify build profile",
      status: input.netlifyNodeVersion === "20" && input.netlifyBuildCommand === "npm run build" && input.netlifyPublishDir === "dist" ? "pass" : "fail",
      summary: `Node ${input.netlifyNodeVersion}, build '${input.netlifyBuildCommand}', publish '${input.netlifyPublishDir}'.`,
      action: "Use Node 20, npm run build and dist to keep deploys predictable.",
    },
    {
      id: "archive-hygiene",
      title: "Archive hygiene",
      status: input.packageLockExcluded && input.nodeModulesExcluded && input.distExcluded ? "pass" : "fail",
      summary: input.packageLockExcluded && input.nodeModulesExcluded && input.distExcluded
        ? "ZIP policy excludes package-lock.json, node_modules and dist."
        : "ZIP policy must exclude generated or heavy files.",
      action: "Do not ship node_modules, dist, .vite, .git or package-lock.json in generated handoff ZIPs.",
    },
    {
      id: "qa-gate",
      title: "Fullcheck gate",
      status: input.fullcheckAvailable && input.engineModuleCount >= 37 ? "pass" : input.fullcheckAvailable ? "warning" : "fail",
      summary: `${input.engineModuleCount} engine checks available for fullcheck.`,
      action: "Run npm run check, npm run build and npm run fullcheck before every public ZIP.",
    },
    {
      id: "ui-surface",
      title: "Large UI surface",
      status: input.totalTabs <= 38 && input.appEstimatedLines <= 10_000 ? "pass" : input.totalTabs <= 44 ? "warning" : "fail",
      summary: `${input.totalTabs} tabs, App.tsx estimate ${input.appEstimatedLines} lines.`,
      action: "Next refactor target: extract high-traffic tabs into components after beta testing stabilizes.",
    },
    {
      id: "schema-version",
      title: "Save schema version",
      status: input.saveSchemaVersion >= 41 ? "pass" : "warning",
      summary: `Current save schema is ${input.saveSchemaVersion}.`,
      action: "Keep save migration active even for performance-only releases.",
    },
  ];

  const passCount = checks.filter((item) => item.status === "pass").length;
  const warningCount = checks.filter((item) => item.status === "warning").length;
  const failCount = checks.filter((item) => item.status === "fail").length;
  const score = Math.round((checks.reduce((sum, item) => sum + statusWeight(item.status), 0) / checks.length) * 100);

  return {
    score,
    statusLabel: getStatusLabel(score, failCount, warningCount),
    passCount,
    warningCount,
    failCount,
    checks,
    chunkPlan: [
      { name: "vendor-react", purpose: "React and React DOM runtime", expectedMaxKb: 180 },
      { name: "engine", purpose: "Deterministic football manager engine modules", expectedMaxKb: 230 },
      { name: "services", purpose: "Auth, save, migration and database services", expectedMaxKb: 40 },
      { name: "index", purpose: "Application shell and UI state", expectedMaxKb: 280 },
    ],
    netlifyBuildProfile: [
      "Build command: npm run build",
      "Publish directory: dist",
      "NODE_VERSION=20",
      "NPM_CONFIG_PRODUCTION=false",
      "NPM_FLAGS=--include=dev",
      "No reinstall-heavy custom commands in Netlify build settings",
    ],
    recommendedCommands: [
      "npm run check",
      "npm run build",
      "npm run fullcheck",
      "npm run performance",
    ],
    releaseNotes: [
      `v${input.appVersion} focuses on deploy optimization rather than new gameplay systems.`,
      "Vite now splits React, engine and service code into separate chunks.",
      "The previous large JS chunk warning is resolved without adding dependencies.",
      "JSON save fallback, Real Database Mode and Supabase Auth remain unchanged.",
    ],
  };
}
