import { buildAdminDebugPanel } from "./adminDebug";
import { createMockLeagueTeams, USER_TEAM_ID } from "./leagueSimulation";

const teams = createMockLeagueTeams();
const userTeam = teams.find((team) => team.id === USER_TEAM_ID);
if (!userTeam) throw new Error("User team missing in admin debug test.");

const report = buildAdminDebugPanel({
  appVersion: "2.2.0",
  authenticated: true,
  managerId: "test-user",
  supabaseConfigured: true,
  localSaveAvailable: true,
  cloudSaveLikelyAvailable: true,
  seasonNumber: 2,
  currentRound: 4,
  maxRound: 14,
  teamsCount: 8,
  fixturesCount: 56,
  resultsCount: 12,
  standingsCount: 8,
  userTeam,
  cashBalance: 45000,
  wageBudget: 1400,
  transferBudget: 22000,
  trainingHistoryCount: 3,
  transferHistoryCount: 1,
  financeHistoryCount: 4,
  academyProspectsCount: 2,
  seasonHistoryCount: 1,
  cupHistoryCount: 2,
  boardReviewsCount: 2,
  scoutingReportsCount: 3,
  lastSaveStatus: "Salvat local pentru contul tau.",
  lastError: "",
  savePayloadBytes: 120000,
});

if (report.score < 80) {
  throw new Error(`Expected admin debug score above 80, got ${report.score}`);
}

if (report.failCount !== 0) {
  throw new Error(`Expected no admin blockers, got ${report.failCount}`);
}

if (!report.exportSummary.includes("2.2.0")) {
  throw new Error("Expected export summary to include app version.");
}

console.log("Admin debug test passed", {
  score: report.score,
  status: report.statusLabel,
  facts: report.saveFacts.length,
});
