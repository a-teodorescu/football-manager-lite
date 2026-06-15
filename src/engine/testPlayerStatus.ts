import { createMockLeagueTeams, defaultUserTactic, simulateRound } from "./leagueSimulation";
import { generateFixtures } from "./fixtureGenerator";
import { createInitialStandings } from "./standings";
import { getAverageFitness, getUnavailablePlayers } from "./playerStatus";

let teams = createMockLeagueTeams();
let fixtures = generateFixtures(teams);
let standings = createInitialStandings(teams);

const roundOne = simulateRound(fixtures, standings, 1, 1, defaultUserTactic, teams);
teams = roundOne.updatedTeams;
fixtures = roundOne.updatedFixtures;
standings = roundOne.updatedStandings;

const userTeam = teams.find((team) => team.id === "team-1");

if (!userTeam) {
  throw new Error("User team missing after status simulation.");
}

console.log("\nPLAYER STATUS TEST\n");
console.log(roundOne.statusReport.summary);
console.log(`Average fitness ${userTeam.name}: ${getAverageFitness(userTeam)}`);
console.log(`Unavailable players: ${getUnavailablePlayers(userTeam).length}`);
console.log(`Standings rows: ${standings.length}`);
console.log(`Fixtures after round 1: ${fixtures.filter((fixture) => fixture.played).length} played`);
