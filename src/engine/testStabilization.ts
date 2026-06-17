import { buildStabilityReport } from "./stabilization";

const report = buildStabilityReport({
  appVersion: "3.4.0",
  saveSchemaVersion: 34,
  savePayloadVersion: 34,
  savePayloadBytes: 120000,
  appTsxLines: 8100,
  totalTabs: 31,
  errorBoundaryEnabled: true,
  fullcheckAvailable: true,
  hasRecentError: false,
  teamsCount: 8,
  fixturesCount: 56,
  standingsCount: 8,
  userPlayersCount: 22,
  engineModuleCount: 30,
});

if (report.score <= 0) throw new Error("Stability score must be positive.");
if (!report.checks.some((item) => item.id === "schema" && item.status === "pass")) {
  throw new Error("Schema check should pass.");
}
if (!report.fullCheckCommand.includes("fullcheck")) throw new Error("Fullcheck command missing.");

console.log("Stabilization OK", report.statusLabel, report.score);
