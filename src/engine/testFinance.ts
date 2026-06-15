import { createMockLeagueTeams, defaultUserTactic, simulateRound, USER_TEAM_ID } from "./leagueSimulation";
import { generateFixtures } from "./fixtureGenerator";
import { createInitialStandings } from "./standings";
import { applyRoundFinances, calculateSquadWageBill, createInitialFinance } from "./finance";

const teams = createMockLeagueTeams();
const fixtures = generateFixtures(teams);
const standings = createInitialStandings(teams);
const simulation = simulateRound(fixtures, standings, 1, 1, defaultUserTactic, teams);
const userTeam = simulation.updatedTeams.find((team) => team.id === USER_TEAM_ID);

if (!userTeam) {
  throw new Error("User team missing after simulation.");
}

const wageBill = calculateSquadWageBill(userTeam);
if (wageBill <= 0) {
  throw new Error("Expected positive wage bill.");
}

const result = applyRoundFinances({
  finance: createInitialFinance(1),
  userTeam,
  roundResults: simulation.roundResults,
  standings: simulation.updatedStandings,
  seasonNumber: 1,
  round: 1,
});

if (!Number.isFinite(result.finance.cashBalance) || !Number.isFinite(result.report.netChange)) {
  throw new Error("Finance result must be numeric.");
}

console.log(`Finance test passed. Wage bill: ${wageBill}k, net: ${result.report.netChange}k.`);
