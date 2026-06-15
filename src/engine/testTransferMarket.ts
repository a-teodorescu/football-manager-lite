import { createMockLeagueTeams, USER_TEAM_ID } from "./leagueSimulation";
import {
  buyMarketPlayer,
  createFreeAgentMarket,
  estimatePlayerValue,
  formatMoney,
  getInitialTransferBudget,
  sellSquadPlayer,
} from "./transferMarket";

const teams = createMockLeagueTeams();
const userTeam = teams.find((team) => team.id === USER_TEAM_ID);

if (!userTeam) {
  throw new Error("User team missing.");
}

const budget = getInitialTransferBudget(1);
const market = createFreeAgentMarket(1, 1);
const affordable = market.find((player) => player.value <= budget);

if (!affordable) {
  throw new Error("Expected at least one affordable market player.");
}

const bought = buyMarketPlayer(userTeam, affordable, budget, 1, 1);
const sellCandidate = bought.team.players.find((player) => player.position === "ATT" && player.id !== bought.record.playerId);

if (!sellCandidate) {
  throw new Error("Expected a sell candidate.");
}

const sold = sellSquadPlayer(bought.team, sellCandidate.id, bought.budget, 1, 1);

console.log("\nTRANSFER MARKET TEST\n");
console.log(`Initial budget: ${formatMoney(budget)}`);
console.log(`Market players: ${market.length}`);
console.log(`Bought: ${bought.record.playerName} for ${formatMoney(bought.record.value)}`);
console.log(`Sold: ${sold.record.playerName} for ${formatMoney(sold.record.value)}`);
console.log(`Budget after transfers: ${formatMoney(sold.budget)}`);
console.log(`Example squad value: ${formatMoney(estimatePlayerValue(sold.team.players[0]))}`);
console.log(`Squad size: ${sold.team.players.length}`);
