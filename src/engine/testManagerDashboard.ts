import { createInitialFinance } from "./finance";
import { createMockLeagueTeams, defaultUserTactic, USER_TEAM_ID } from "./leagueSimulation";
import { buildManagerDashboard } from "./managerDashboard";
import { createInitialStandings } from "./standings";

const teams = createMockLeagueTeams();
const userTeam = teams.find((team) => team.id === USER_TEAM_ID);
if (!userTeam) throw new Error("User team missing in dashboard test.");

const dashboard = buildManagerDashboard({
  team: userTeam,
  tactic: defaultUserTactic,
  standings: createInitialStandings(teams),
  finance: createInitialFinance(1),
  transferBudget: 12000,
  academyLevel: 1,
  currentRound: 1,
  maxRound: 14,
  seasonFinished: false,
});

if (dashboard.rating < 1 || dashboard.rating > 100) {
  throw new Error(`Invalid manager rating: ${dashboard.rating}`);
}

if (dashboard.objectives.length !== 4) {
  throw new Error(`Expected 4 objectives, got ${dashboard.objectives.length}`);
}

if (dashboard.keyPlayers.length === 0) {
  throw new Error("Dashboard should expose key players.");
}

console.log("Manager dashboard test passed", {
  rating: dashboard.rating,
  confidence: dashboard.boardConfidenceLabel,
  objectives: dashboard.objectives.length,
  alerts: dashboard.alerts.length,
});
