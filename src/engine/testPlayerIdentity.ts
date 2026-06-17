import { createMockLeagueTeams } from "./leagueSimulation";
import {
  buildPlayerIdentityOverview,
  buildPlayerIdentitySummary,
  normalizeTeamPlayerIdentities,
} from "./playerIdentity";

const teams = createMockLeagueTeams().map(normalizeTeamPlayerIdentities);
const userTeam = teams[0];
const overview = buildPlayerIdentityOverview(userTeam);

if (overview.totalPlayers !== userTeam.players.length) {
  throw new Error("Identity overview player count mismatch.");
}

if (overview.countriesCount < 1) {
  throw new Error("Expected at least one country in player identity overview.");
}

const missingIdentity = userTeam.players.find(
  (player) =>
    !player.nationality ||
    !player.flagEmoji ||
    !player.preferredFoot ||
    !player.personality ||
    !player.role ||
    typeof player.marketability !== "number",
);

if (missingIdentity) {
  throw new Error(`Player identity incomplete for ${missingIdentity.name}.`);
}

const profileSummary = buildPlayerIdentitySummary(userTeam.players[0]);

if (!profileSummary.includes("foot")) {
  throw new Error("Expected profile summary to include preferred foot.");
}

console.log(
  `Player identity OK: ${overview.totalPlayers} players, ${overview.countriesCount} countries, average marketability ${overview.averageMarketability}.`,
);
