import { generateFixtures } from "./fixtureGenerator";
import {
  buildLeagueOverview,
  createExpandedLeagueTeams,
  getLeagueRivalries,
  getTacticForTeamStyle,
} from "./leagueExpansion";
import { USER_TEAM_ID } from "./leagueSimulation";
import { createInitialStandings } from "./standings";

const teams = createExpandedLeagueTeams();
const fixtures = generateFixtures(teams);
const standings = createInitialStandings(teams);
const overview = buildLeagueOverview({
  teams,
  fixtures,
  standings,
  currentRound: 1,
  maxRound: 14,
  userTeamId: USER_TEAM_ID,
});
const rivalries = getLeagueRivalries(teams);
const pressingTactic = getTacticForTeamStyle("pressing");

if (teams.length !== 8) {
  throw new Error(`Expected 8 league teams, received ${teams.length}.`);
}

if (!teams.every((team) => team.city && team.stadium && team.tacticalStyle && team.ambition)) {
  throw new Error("Every team should have identity metadata.");
}

if (!overview.fixtureOfTheWeek) {
  throw new Error("League overview should select a fixture of the week.");
}

if (overview.teams.length !== teams.length) {
  throw new Error("League overview team snapshot count mismatch.");
}

if (rivalries.length < 3) {
  throw new Error("Expected at least three rivalries.");
}

if (pressingTactic.pressing !== "high") {
  throw new Error("Pressing teams should use high pressing AI tactic.");
}

console.log("League expansion OK");
console.table(
  overview.teams.map((team) => ({
    Team: team.name,
    City: team.city,
    Style: team.tacticalStyle,
    Ambition: team.ambition,
    Tier: team.tier,
  })),
);
