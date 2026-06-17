import { buildBetaPolishReleaseReport } from "./betaPolishRelease";

const report = buildBetaPolishReleaseReport({
  appVersion: "4.0.0",
  saveSchemaVersion: 40,
  betaReadinessScore: 88,
  stabilityScore: 86,
  adminScore: 84,
  databaseReadinessScore: 78,
  multiplayerReadinessScore: 74,
  tacticalScore: 72,
  authenticated: true,
  supabaseConfigured: true,
  localSaveAvailable: true,
  cloudSaveLikelyAvailable: true,
  resultsCount: 8,
  seasonHistoryCount: 1,
  inboxUnreadCount: 3,
  savePayloadBytes: 260_000,
  totalTabs: 35,
  engineChecksCount: 36,
  hasRecentError: false,
});

if (report.score < 80) {
  throw new Error(`Expected release score >= 80, got ${report.score}`);
}

if (report.failCount !== 0) {
  throw new Error(`Expected no release blockers, got ${report.failCount}`);
}

if (!report.qaCommands.includes("npm run release")) {
  throw new Error("Expected npm run release to be listed in QA commands.");
}

if (report.exportFilename !== "football-manager-lite-save-v4_0_0.json") {
  throw new Error(`Unexpected export filename: ${report.exportFilename}`);
}

console.log("Beta polish release test OK", report.statusLabel, report.score);
