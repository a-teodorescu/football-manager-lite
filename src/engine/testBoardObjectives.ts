import { createInitialBoardState, evaluateBoard, getJobStatusLabel } from "./boardObjectives";
import { createInitialCupState } from "./cupCompetition";
import { createInitialFinance } from "./finance";
import { generateFixtures } from "./fixtureGenerator";
import { createMockLeagueTeams, defaultUserTactic, getMaxRound, simulateRound } from "./leagueSimulation";
import { createInitialStandings } from "./standings";

let teams = createMockLeagueTeams();
let fixtures = generateFixtures(teams);
let standings = createInitialStandings(teams);
let board = createInitialBoardState(1);
const maxRound = getMaxRound(fixtures);

for (let round = 1; round <= 3; round += 1) {
  const simulation = simulateRound(fixtures, standings, round, 1, defaultUserTactic, teams);
  teams = simulation.updatedTeams;
  fixtures = simulation.updatedFixtures;
  standings = simulation.updatedStandings;
  const userTeam = teams.find((team) => team.id === "team-1");
  if (!userTeam) throw new Error("User team missing in board test.");

  board = evaluateBoard({
    board,
    team: userTeam,
    standings,
    finance: createInitialFinance(1),
    transferBudget: 5000,
    academyLevel: 2,
    cupState: createInitialCupState(teams, 1),
    seasonNumber: 1,
    currentRound: round + 1,
    maxRound,
    seasonFinished: false,
    forceReview: true,
  }).board;
}

if (board.objectives.length < 5) throw new Error("Board objectives were not created.");
if (board.reviews.length < 3) throw new Error("Board reviews were not recorded.");
if (board.jobSecurity < 1 || board.jobSecurity > 100) throw new Error("Job security out of range.");

console.log(`Board OK: job ${getJobStatusLabel(board.jobStatus)}, security ${board.jobSecurity}/100, reviews ${board.reviews.length}.`);
