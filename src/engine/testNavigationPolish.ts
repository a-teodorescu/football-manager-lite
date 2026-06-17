import { createInitialFinance } from "./finance";
import { autoPickLineup } from "./lineupSelection";
import { createMockLeagueTeams, defaultUserTactic, USER_TEAM_ID } from "./leagueSimulation";
import { buildManagerNavigationReport } from "./managerNavigation";
import { autoPickSetPieces } from "./setPieces";
import { autoPickSubstitutionPlan } from "./substitutions";

const teams = createMockLeagueTeams();
const rawUserTeam = teams.find((team) => team.id === USER_TEAM_ID);
if (!rawUserTeam) throw new Error("User team missing in navigation test.");

const teamWithLineup = autoPickLineup(rawUserTeam, defaultUserTactic.formation);
const teamWithSubs = autoPickSubstitutionPlan(teamWithLineup, defaultUserTactic.formation);
const preparedTeam = autoPickSetPieces(teamWithSubs, defaultUserTactic.formation);
const finance = createInitialFinance(1);

const report = buildManagerNavigationReport({
  team: preparedTeam,
  formation: defaultUserTactic.formation,
  currentRound: 1,
  maxRound: 14,
  seasonFinished: false,
  nextMatchAvailable: true,
  trainingDoneThisRound: false,
  unreadInboxCount: 2,
  transferBudget: 12000,
  cashBalance: finance.cashBalance,
});

if (report.groups.length < 5) {
  throw new Error(`Expected grouped navigation, got ${report.groups.length} groups.`);
}

if (report.totalTabs < 40) {
  throw new Error(`Expected at least 40 tabs, got ${report.totalTabs}.`);
}

if (!report.groups.some((group) => group.tabs.some((tab) => tab.tab === "europe"))) {
  throw new Error("European competitions tab should be present in grouped navigation.");
}

if (report.mobilePrimaryTabs.length < 4) {
  throw new Error("Mobile primary tabs should expose the most used screens.");
}

if (report.matchReadinessScore < 60 || report.matchReadinessScore > 100) {
  throw new Error(`Unexpected readiness score: ${report.matchReadinessScore}`);
}

if (report.quickActions.length === 0) {
  throw new Error("Dashboard navigation should expose quick actions.");
}

console.log("Navigation polish test passed", {
  groups: report.groups.length,
  totalTabs: report.totalTabs,
  readiness: report.matchReadinessScore,
  quickActions: report.quickActions.length,
});
