import { createInitialFinance } from "./finance";
import { defaultUserTactic, createMockLeagueTeams, USER_TEAM_ID } from "./leagueSimulation";
import { buildScoutReport, getTopScoutRecommendations, upsertScoutReport } from "./scouting";
import { createFreeAgentMarket, getInitialTransferBudget } from "./transferMarket";

const seasonNumber = 1;
const round = 3;
const team = createMockLeagueTeams().find((item) => item.id === USER_TEAM_ID);
if (!team) throw new Error("User team not found.");

const market = createFreeAgentMarket(seasonNumber, round, 6);
const finance = createInitialFinance(seasonNumber);
const report = buildScoutReport({
  player: market[0],
  team,
  tactic: defaultUserTactic,
  transferBudget: getInitialTransferBudget(seasonNumber),
  finance,
  seasonNumber,
  round,
});

if (!report.summary.includes(market[0].name)) {
  throw new Error("Scout report summary should include player name.");
}

if (report.tacticalFit < 1 || report.tacticalFit > 100) {
  throw new Error("Tactical fit should be between 1 and 100.");
}

if (report.financialFit < 1 || report.financialFit > 100) {
  throw new Error("Financial fit should be between 1 and 100.");
}

const reports = market.map((player) => buildScoutReport({
  player,
  team,
  tactic: defaultUserTactic,
  transferBudget: getInitialTransferBudget(seasonNumber),
  finance,
  seasonNumber,
  round,
}));

const upserted = upsertScoutReport([], report);
if (upserted.length !== 1 || upserted[0].targetPlayerId !== report.targetPlayerId) {
  throw new Error("Scout report upsert failed.");
}

const recommendations = getTopScoutRecommendations(reports, 3);
if (recommendations.length !== 3) {
  throw new Error("Expected three scout recommendations.");
}

console.log("Scouting system test passed.", report.summary);
