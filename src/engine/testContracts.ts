import { createMockLeagueTeams, USER_TEAM_ID } from "./leagueSimulation";
import { createInitialFinance } from "./finance";
import {
  getContractOffer,
  getContractRiskSummary,
  normalizeTeamContracts,
  releaseExpiredContractPlayers,
  renewPlayerContract,
} from "./contracts";

const seasonNumber = 1;
const userTeam = normalizeTeamContracts(
  createMockLeagueTeams().find((team) => team.id === USER_TEAM_ID)!,
  seasonNumber
);
const target = userTeam.players[0];
const offer = getContractOffer(target, seasonNumber);

if (!offer.wage || offer.wage < 1) {
  throw new Error("Contract offer wage was not generated correctly.");
}

const renewal = renewPlayerContract({
  team: userTeam,
  finance: createInitialFinance(seasonNumber),
  playerId: target.id,
  seasonNumber,
  round: 1,
});

const renewed = renewal.team.players.find((player) => player.id === target.id);
if (!renewed?.contract || renewed.contract.expiresSeason <= seasonNumber) {
  throw new Error("Renewed contract did not extend the player.");
}

const expiredTeam = {
  ...renewal.team,
  players: renewal.team.players.map((player, index) =>
    index < 2 && player.contract
      ? { ...player, contract: { ...player.contract, expiresSeason: 1 } }
      : player
  ),
};
const release = releaseExpiredContractPlayers({ team: expiredTeam, nextSeasonNumber: 2 });

if (release.team.players.length > expiredTeam.players.length) {
  throw new Error("Expired contract resolution increased squad size unexpectedly.");
}

console.log("Contracts test OK");
console.log(getContractRiskSummary(renewal.team, seasonNumber));
