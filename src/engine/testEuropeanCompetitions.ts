import {
  createInitialEuropeanCompetitionState,
  getEuropeanRoundLabel,
  simulateEuropeanRound,
} from "./europeanCompetitions";
import { createMockLeagueTeams, defaultUserTactic } from "./leagueSimulation";

let teams = createMockLeagueTeams();
let state = createInitialEuropeanCompetitionState(teams, 1);
const records: string[] = [];

while (state.status !== "completed") {
  const simulation = simulateEuropeanRound({
    state,
    teams,
    seasonNumber: 1,
    userTactic: defaultUserTactic,
  });

  state = simulation.state;
  teams = simulation.teams;
  records.push(`${getEuropeanRoundLabel(simulation.record.roundName)}: ${simulation.record.summary}`);
}

if (!state.championTeamName) {
  throw new Error("European competition ended without champion.");
}

if (records.length !== 4) {
  throw new Error(`Expected 4 European rounds, received ${records.length}.`);
}

console.log(records.join("\n"));
console.log(`European champion: ${state.championTeamName}`);
