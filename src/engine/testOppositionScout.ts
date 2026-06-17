import { generateFixtures } from "./fixtureGenerator";
import { createMockLeagueTeams, defaultUserTactic, USER_TEAM_ID } from "./leagueSimulation";
import { autoPickLineup } from "./lineupSelection";
import { autoPickSetPieces } from "./setPieces";
import { buildOppositionScoutReport, buildRecommendedMatchPlan } from "./oppositionScout";
import { calculateAdvancedTeamStrength } from "./advancedTactics";

const teams = createMockLeagueTeams();
const baseUserTeam = teams.find((team) => team.id === USER_TEAM_ID);
if (!baseUserTeam) throw new Error("User team missing from mock league.");

const userTeam = autoPickSetPieces(autoPickLineup(baseUserTeam, defaultUserTactic.formation), defaultUserTactic.formation);
const fixture = generateFixtures(teams).find(
  (item) => item.homeTeam.id === USER_TEAM_ID || item.awayTeam.id === USER_TEAM_ID,
);
if (!fixture) throw new Error("No user fixture generated.");

const hydratedFixture = {
  ...fixture,
  homeTeam: fixture.homeTeam.id === USER_TEAM_ID ? userTeam : fixture.homeTeam,
  awayTeam: fixture.awayTeam.id === USER_TEAM_ID ? userTeam : fixture.awayTeam,
};

const report = buildOppositionScoutReport({
  fixture: hydratedFixture,
  userTeam,
  userTactic: defaultUserTactic,
});

if (!report.available) throw new Error("Opposition scout report should be available.");
if (!report.opponentName) throw new Error("Opponent name should be present.");
if (!report.opponentTactic) throw new Error("Opponent tactic should be present.");
if (report.readinessScore < 1 || report.readinessScore > 100) throw new Error("Readiness score out of range.");
if (report.adjustments.length === 0) throw new Error("Expected at least one match-plan adjustment or keep-current recommendation.");
if (report.checklist.length === 0) throw new Error("Expected preparation checklist.");

const opponentTeam = hydratedFixture.homeTeam.id === USER_TEAM_ID ? hydratedFixture.awayTeam : hydratedFixture.homeTeam;
const userStrength = calculateAdvancedTeamStrength(userTeam, defaultUserTactic);
const opponentStrength = calculateAdvancedTeamStrength(opponentTeam, report.opponentTactic);
const manualPlan = buildRecommendedMatchPlan({
  userTeam,
  userTactic: defaultUserTactic,
  opponentTeam,
  opponentTactic: report.opponentTactic,
  venue: report.venue,
  userStrength,
  opponentStrength,
});

if (!manualPlan.tactic.formation || !manualPlan.tactic.mentality || !manualPlan.tactic.pressing) {
  throw new Error("Recommended plan returned an invalid tactic.");
}

console.log("Opposition scout test OK", {
  match: report.matchLabel,
  opponent: report.opponentName,
  risk: report.risk,
  readiness: report.readinessScore,
  adjustments: report.adjustments.length,
});
