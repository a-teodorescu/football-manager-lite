import { buildPerformanceDeployReport } from "./performanceDeploy";

const report = buildPerformanceDeployReport({
  appVersion: "4.2.0",
  saveSchemaVersion: 42,
  appEstimatedLines: 8700,
  totalTabs: 36,
  engineModuleCount: 38,
  buildUsesManualChunks: true,
  reactVendorChunk: true,
  engineChunk: true,
  servicesChunk: true,
  sourcemapDisabled: true,
  packageLockExcluded: true,
  nodeModulesExcluded: true,
  distExcluded: true,
  netlifyNodeVersion: "20",
  netlifyBuildCommand: "npm run build",
  netlifyPublishDir: "dist",
  fullcheckAvailable: true,
  bundleWarningResolved: true,
});

if (report.score < 88) {
  throw new Error(`Expected performance score >= 88, got ${report.score}`);
}

if (report.failCount !== 0) {
  throw new Error(`Expected no performance blockers, got ${report.failCount}`);
}

if (!report.chunkPlan.some((chunk) => chunk.name === "engine")) {
  throw new Error("Expected engine chunk in performance chunk plan.");
}

if (!report.recommendedCommands.includes("npm run performance")) {
  throw new Error("Expected npm run performance in recommended commands.");
}

console.log("Performance deploy test OK", report.statusLabel, report.score);
