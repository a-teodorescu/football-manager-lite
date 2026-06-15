import { createMockLeagueTeams, defaultUserTactic, getMaxRound, simulateRound, USER_TEAM_ID } from "./leagueSimulation";
import { generateFixtures } from "./fixtureGenerator";
import { createInitialStandings } from "./standings";
import { createInitialFinance } from "./finance";
import { prepareNextSeason } from "./seasonProgression";

let teams = createMockLeagueTeams();
let fixtures = generateFixtures(teams);
let standings = createInitialStandings(teams);
const finalRound = getMaxRound(fixtures);

for (let round = 1; round <= finalRound; round += 1) {
  const simulation = simulateRound(fixtures, standings, round, 1, defaultUserTactic, teams);
  teams = simulation.updatedTeams;
  fixtures = simulation.updatedFixtures;
  standings = simulation.updatedStandings;
}

const nextSeason = prepareNextSeason({
  currentSeasonNumber: 1,
  teams,
  standings,
  finance: createInitialFinance(1),
});

const userTeam = nextSeason.teams.find((team) => team.id === USER_TEAM_ID);

if (nextSeason.seasonNumber !== 2) throw new Error("Expected next season number to be 2.");
if (!userTeam) throw new Error("Expected user team to carry into next season.");
if (userTeam.players.some((player) => player.injury)) throw new Error("Expected injuries to reset before new season.");
if (nextSeason.fixtures.length !== 56) throw new Error("Expected 56 fixtures in the new season.");
if (nextSeason.standings.some((row) => row.played !== 0)) throw new Error("Expected standings to reset.");
if (nextSeason.seasonRecord.prizeMoney <= 0) throw new Error("Expected prize money to be awarded.");

console.log(`Season progression OK: S${nextSeason.seasonNumber}, ${nextSeason.fixtures.length} fixtures, prize ${nextSeason.seasonRecord.prizeMoney}`);
