import { simulateFixture } from "./leagueSimulation";
import { createMockLeagueTeams, defaultUserTactic, USER_TEAM_ID } from "./leagueSimulation";
import { generateFixtures } from "./fixtureGenerator";
import { calculateAdvancedTeamStrength } from "./advancedTactics";
import {
  applyLineupSelectionToTeam,
  autoPickLineup,
  buildDefaultLineupPlayerIds,
  getSelectedLineupPlayerIds,
  validateLineupSelection,
} from "./lineupSelection";

const teams = createMockLeagueTeams();
const userTeam = teams.find((team) => team.id === USER_TEAM_ID);
if (!userTeam) throw new Error("Expected user team for lineup test.");

const defaultIds = buildDefaultLineupPlayerIds(userTeam, defaultUserTactic.formation);
if (defaultIds.length !== 11) throw new Error("Default lineup should contain 11 players.");
if (new Set(defaultIds).size !== 11) throw new Error("Default lineup should not contain duplicate players.");

const autoPickedTeam = autoPickLineup(userTeam, defaultUserTactic.formation);
const report = validateLineupSelection(autoPickedTeam, defaultUserTactic.formation);
if (!report.isValid) throw new Error(`Auto-picked lineup should be valid: ${report.summary}`);
if (report.positionCounts.GK !== 1) throw new Error("Lineup should include one goalkeeper.");

const shortenedTeam = applyLineupSelectionToTeam(autoPickedTeam, defaultIds.slice(0, 10));
const invalidReport = validateLineupSelection(shortenedTeam, defaultUserTactic.formation);
if (invalidReport.isValid) throw new Error("10-player lineup should not be valid.");

const strongest = calculateAdvancedTeamStrength(autoPickedTeam, defaultUserTactic);
if (strongest.overall <= 0) throw new Error("Lineup strength should be calculated.");

const selectedIds = getSelectedLineupPlayerIds(autoPickedTeam, defaultUserTactic.formation);
const starters = new Set(selectedIds);
const fixtures = generateFixtures(teams.map((team) => (team.id === USER_TEAM_ID ? autoPickedTeam : team)));
const userFixture = fixtures.find((fixture) => fixture.homeTeam.id === USER_TEAM_ID || fixture.awayTeam.id === USER_TEAM_ID);
if (!userFixture) throw new Error("Expected user fixture for lineup simulation.");

const result = simulateFixture(userFixture, 1, defaultUserTactic);
const userSide = result.result.homeTeamId === USER_TEAM_ID ? "home" : "away";
const userEventPlayerIds = result.result.events
  .filter((event) => event.team === userSide && event.playerId)
  .map((event) => String(event.playerId));

if (userEventPlayerIds.some((playerId) => !starters.has(playerId))) {
  throw new Error("Match events should use players from the selected starting XI.");
}

console.log("Lineup selection test OK", {
  starters: selectedIds.length,
  score: report.score,
  formation: defaultUserTactic.formation,
  match: `${result.result.homeTeamName} ${result.result.homeScore}-${result.result.awayScore} ${result.result.awayTeamName}`,
});
