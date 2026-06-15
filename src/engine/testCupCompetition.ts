import { createInitialCupState, getCupRoundLabel, simulateCupRound } from "./cupCompetition";
import { createMockLeagueTeams, defaultUserTactic } from "./leagueSimulation";

let teams = createMockLeagueTeams();
let cupState = createInitialCupState(teams, 1);

while (cupState.status !== "completed") {
  const simulation = simulateCupRound({
    cupState,
    teams,
    seasonNumber: 1,
    userTactic: defaultUserTactic,
  });

  cupState = simulation.cupState;
  teams = simulation.teams;

  console.log(
    `${getCupRoundLabel(simulation.record.roundName)}: ${simulation.record.summary} Prize=${simulation.prizeMoney}`
  );
}

if (!cupState.championTeamName) {
  throw new Error("Cup competition ended without champion.");
}

console.log(`Cup champion: ${cupState.championTeamName}`);
