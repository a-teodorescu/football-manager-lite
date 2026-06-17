import { generateFixtures } from "./fixtureGenerator";
import { createMockLeagueTeams, defaultUserTactic, simulateFixture, USER_TEAM_ID } from "./leagueSimulation";
import { autoPickLineup, getSelectedLineupPlayerIds } from "./lineupSelection";
import {
  addSubstitutionToTeam,
  autoPickSubstitutionPlan,
  buildDefaultSubstitutionPlan,
  buildSubstitutionReport,
  clearSubstitutionPlan,
} from "./substitutions";

const teams = createMockLeagueTeams();
const rawUserTeam = teams.find((team) => team.id === USER_TEAM_ID);
if (!rawUserTeam) throw new Error("Expected user team for substitutions test.");

const userTeam = autoPickLineup(rawUserTeam, defaultUserTactic.formation);
const startingIds = getSelectedLineupPlayerIds(userTeam, defaultUserTactic.formation);
if (startingIds.length !== 11) throw new Error("Substitution test needs a valid starting XI.");

const defaultPlan = buildDefaultSubstitutionPlan(userTeam, defaultUserTactic.formation);
if (defaultPlan.length === 0) throw new Error("Expected at least one recommended substitution.");
if (defaultPlan.length > 3) throw new Error("Substitution plan should be capped at 3 changes.");

const plannedTeam = autoPickSubstitutionPlan(userTeam, defaultUserTactic.formation);
const report = buildSubstitutionReport(plannedTeam, defaultUserTactic.formation);
if (!report.isValid) throw new Error(`Auto-picked substitution report should be valid: ${report.summary}`);
if (report.planned.length === 0) throw new Error("Planned substitutions should be visible in report.");
if (report.bench.length === 0) throw new Error("Report should include bench players.");

const firstRecommendation = report.recommendations[0];
const manualTeam = addSubstitutionToTeam(clearSubstitutionPlan(plannedTeam), {
  outPlayerId: firstRecommendation.outPlayerId,
  inPlayerId: firstRecommendation.inPlayerId,
  minute: 58,
  reason: "Manual test substitution",
});
const manualReport = buildSubstitutionReport(manualTeam, defaultUserTactic.formation);
if (!manualReport.isValid || manualReport.planned[0]?.minute !== 58) {
  throw new Error("Manual substitution should be normalized and valid.");
}

const matchTeams = teams.map((team) => (team.id === USER_TEAM_ID ? manualTeam : team));
const fixtures = generateFixtures(matchTeams);
const userFixture = fixtures.find((fixture) => fixture.homeTeam.id === USER_TEAM_ID || fixture.awayTeam.id === USER_TEAM_ID);
if (!userFixture) throw new Error("Expected user fixture for substitution simulation.");

const result = simulateFixture(userFixture, 1, defaultUserTactic);
const userSide = result.result.homeTeamId === USER_TEAM_ID ? "home" : "away";
const substitutionEvents = result.result.events.filter((event) => event.team === userSide && event.type === "substitution");
if (substitutionEvents.length !== 1) {
  throw new Error(`Expected one user substitution event, got ${substitutionEvents.length}.`);
}
if (substitutionEvents[0].minute !== 58) {
  throw new Error("Substitution event should happen at the planned minute.");
}

const incomingPlayerId = manualReport.planned[0].inPlayerId;
const laterUserEvents = result.result.events.filter(
  (event) => event.team === userSide && event.minute > 58 && event.playerId === incomingPlayerId,
);

console.log("Substitutions test OK", {
  planned: report.planned.length,
  benchStrength: report.benchStrength,
  expectedImpact: report.expectedImpact,
  substitutionMinute: substitutionEvents[0].minute,
  incomingInvolvedAfterSub: laterUserEvents.length,
});
