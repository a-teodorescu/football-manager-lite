import { getPlayerWage, type ClubFinance } from "./finance";
import { clamp } from "./random";
import { estimatePlayerValue, formatMoney } from "./transferMarket";
import type { Player, Position, Team } from "./types";

export type ContractStatus = "secure" | "expiring" | "expired" | "unhappy";
export type ContractRecordType = "renew" | "release" | "auto_release";

export interface ContractRecord {
  id: string;
  type: ContractRecordType;
  seasonNumber: number;
  round: number;
  playerId: string;
  playerName: string;
  position: Position;
  age: number;
  oldWage: number;
  newWage?: number;
  signingBonus?: number;
  expiresSeason?: number;
  cashAfter?: number;
  summary: string;
}

export interface ContractOffer {
  playerId: string;
  wage: number;
  years: number;
  signingBonus: number;
  expiresSeason: number;
}

const minimumByPosition: Record<Position, number> = {
  GK: 1,
  DEF: 4,
  MID: 4,
  ATT: 2,
};

function countPlayersByPosition(team: Team, position: Position): number {
  return team.players.filter((player) => player.position === position).length;
}

function canReleasePlayer(team: Team, player: Player): boolean {
  if (team.players.length <= 14) return false;
  return countPlayersByPosition(team, player.position) > minimumByPosition[player.position];
}

export function getInitialContractYears(player: Player): number {
  if (player.age <= 20) return 4;
  if (player.age <= 24) return 3;
  if (player.age <= 31) return 2;
  return 1;
}

export function getContractHappiness(player: Player): number {
  const contract = player.contract;
  if (!contract) return 70;
  return contract.happiness;
}

export function getContractExpirySeason(player: Player, currentSeason: number): number {
  return player.contract?.expiresSeason ?? currentSeason + getInitialContractYears(player);
}

export function createDefaultPlayerContract(player: Player, currentSeason: number): NonNullable<Player["contract"]> {
  const wage = getPlayerWage(player);
  const score = Math.abs(player.id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0));
  const happiness = Math.round(clamp(66 + (player.morale - 70) * 0.25 + (player.form - 65) * 0.12 + (score % 9), 45, 92));

  return {
    wage,
    signedSeason: currentSeason,
    expiresSeason: currentSeason + getInitialContractYears(player),
    happiness,
  };
}

export function normalizePlayerContract(player: Player, currentSeason: number): Player {
  const contract = player.contract ?? createDefaultPlayerContract(player, currentSeason);
  const wage = player.wage ?? contract.wage ?? getPlayerWage(player);

  return {
    ...player,
    wage,
    contract: {
      wage,
      signedSeason: contract.signedSeason ?? currentSeason,
      expiresSeason: contract.expiresSeason ?? currentSeason + getInitialContractYears(player),
      happiness: Math.round(clamp(contract.happiness ?? 70, 1, 100)),
    },
  };
}

export function normalizeTeamContracts(team: Team, currentSeason: number): Team {
  return {
    ...team,
    players: team.players.map((player) => normalizePlayerContract(player, currentSeason)),
  };
}

export function getContractStatus(player: Player, currentSeason: number): ContractStatus {
  const contract = normalizePlayerContract(player, currentSeason).contract;

  if (!contract) return "secure";
  if (contract.expiresSeason < currentSeason) return "expired";
  if (contract.happiness < 45) return "unhappy";
  if (contract.expiresSeason <= currentSeason) return "expiring";
  return "secure";
}

export function getContractStatusLabel(player: Player, currentSeason: number): string {
  const contract = normalizePlayerContract(player, currentSeason).contract;
  const status = getContractStatus(player, currentSeason);

  if (!contract) return "Contract OK";
  if (status === "expired") return "Expired";
  if (status === "expiring") return "Expires this season";
  if (status === "unhappy") return "Unhappy";
  return `Until S${contract.expiresSeason}`;
}

export function getContractOffer(player: Player, currentSeason: number): ContractOffer {
  const normalized = normalizePlayerContract(player, currentSeason);
  const currentWage = getPlayerWage(normalized);
  const value = estimatePlayerValue(normalized);
  const status = getContractStatus(normalized, currentSeason);
  const years = normalized.age >= 33 ? 1 : normalized.age >= 30 ? 2 : normalized.age <= 22 ? 4 : 3;
  const agePremium = normalized.age <= 23 ? 1.18 : normalized.age >= 32 ? 0.98 : 1.08;
  const urgencyPremium = status === "expired" ? 1.22 : status === "expiring" ? 1.14 : status === "unhappy" ? 1.1 : 1.04;
  const qualityPremium = 1 + Math.max(0, normalized.overall - 70) * 0.012;
  const happinessDiscount = Math.max(0, getContractHappiness(normalized) - 70) * 0.002;
  const wage = Math.max(8, Math.round((currentWage * agePremium * urgencyPremium * qualityPremium * (1 - happinessDiscount)) / 2) * 2);
  const signingBonus = Math.max(80, Math.round((value * (0.035 + years * 0.006)) / 25) * 25);

  return {
    playerId: normalized.id,
    wage,
    years,
    signingBonus,
    expiresSeason: currentSeason + years,
  };
}

export function renewPlayerContract(input: {
  team: Team;
  finance: ClubFinance;
  playerId: string;
  seasonNumber: number;
  round: number;
}): { team: Team; finance: ClubFinance; record: ContractRecord } {
  const player = input.team.players.find((item) => item.id === input.playerId);
  if (!player) throw new Error("Jucatorul nu exista in lot.");

  const normalizedPlayer = normalizePlayerContract(player, input.seasonNumber);
  const offer = getContractOffer(normalizedPlayer, input.seasonNumber);

  if (input.finance.cashBalance < offer.signingBonus) {
    throw new Error("Cash insuficient pentru signing bonus.");
  }

  const renewedPlayer: Player = {
    ...normalizedPlayer,
    wage: offer.wage,
    contract: {
      wage: offer.wage,
      signedSeason: input.seasonNumber,
      expiresSeason: offer.expiresSeason,
      happiness: Math.round(clamp(getContractHappiness(normalizedPlayer) + 16, 1, 100)),
    },
    morale: Math.round(clamp(normalizedPlayer.morale + 2, 1, 100)),
  };

  const nextFinance: ClubFinance = {
    ...input.finance,
    cashBalance: input.finance.cashBalance - offer.signingBonus,
  };

  return {
    team: {
      ...input.team,
      players: input.team.players.map((item) => (item.id === input.playerId ? renewedPlayer : item)),
    },
    finance: nextFinance,
    record: {
      id: `contract-renew-${input.seasonNumber}-${input.round}-${input.playerId}`,
      type: "renew",
      seasonNumber: input.seasonNumber,
      round: input.round,
      playerId: renewedPlayer.id,
      playerName: renewedPlayer.name,
      position: renewedPlayer.position,
      age: renewedPlayer.age,
      oldWage: getPlayerWage(normalizedPlayer),
      newWage: offer.wage,
      signingBonus: offer.signingBonus,
      expiresSeason: offer.expiresSeason,
      cashAfter: nextFinance.cashBalance,
      summary: `${renewedPlayer.name} a semnat pana in sezonul ${offer.expiresSeason}: wage ${formatMoney(offer.wage)}, bonus ${formatMoney(offer.signingBonus)}.`,
    },
  };
}

export function releasePlayerFromContract(input: {
  team: Team;
  playerId: string;
  seasonNumber: number;
  round: number;
}): { team: Team; record: ContractRecord } {
  const player = input.team.players.find((item) => item.id === input.playerId);
  if (!player) throw new Error("Jucatorul nu exista in lot.");
  if (!canReleasePlayer(input.team, player)) {
    throw new Error(`Nu poti elibera acest jucator: trebuie sa pastrezi lot minim si minimum ${minimumByPosition[player.position]} pe postul ${player.position}.`);
  }

  return {
    team: {
      ...input.team,
      players: input.team.players.filter((item) => item.id !== input.playerId),
      morale: Math.round(clamp(input.team.morale - 1, 1, 100)),
    },
    record: {
      id: `contract-release-${input.seasonNumber}-${input.round}-${input.playerId}`,
      type: "release",
      seasonNumber: input.seasonNumber,
      round: input.round,
      playerId: player.id,
      playerName: player.name,
      position: player.position,
      age: player.age,
      oldWage: getPlayerWage(player),
      summary: `${player.name} a parasit clubul prin release contractual. Wage bill redus cu ${formatMoney(getPlayerWage(player))}/runda.`,
    },
  };
}

export function releaseExpiredContractPlayers(input: {
  team: Team;
  nextSeasonNumber: number;
}): { team: Team; records: ContractRecord[] } {
  let team = normalizeTeamContracts(input.team, input.nextSeasonNumber);
  const records: ContractRecord[] = [];

  for (const player of [...team.players]) {
    const contract = normalizePlayerContract(player, input.nextSeasonNumber).contract;
    if (!contract || contract.expiresSeason >= input.nextSeasonNumber) continue;
    if (!canReleasePlayer(team, player)) continue;

    team = {
      ...team,
      players: team.players.filter((item) => item.id !== player.id),
      morale: Math.round(clamp(team.morale - 1, 1, 100)),
    };

    records.push({
      id: `contract-auto-release-${input.nextSeasonNumber}-${player.id}`,
      type: "auto_release",
      seasonNumber: input.nextSeasonNumber,
      round: 0,
      playerId: player.id,
      playerName: player.name,
      position: player.position,
      age: player.age,
      oldWage: getPlayerWage(player),
      summary: `${player.name} a plecat liber la startul sezonului ${input.nextSeasonNumber}, dupa expirarea contractului.`,
    });
  }

  return { team, records };
}

export function getContractRiskSummary(team: Team, currentSeason: number): string {
  const normalized = normalizeTeamContracts(team, currentSeason);
  const expiring = normalized.players.filter((player) => getContractStatus(player, currentSeason) === "expiring").length;
  const expired = normalized.players.filter((player) => getContractStatus(player, currentSeason) === "expired").length;
  const unhappy = normalized.players.filter((player) => getContractStatus(player, currentSeason) === "unhappy").length;

  if (expired > 0) return `${expired} contracte expirate necesita rezolvare urgenta.`;
  if (expiring > 0) return `${expiring} jucatori intra in final de contract.`;
  if (unhappy > 0) return `${unhappy} jucatori sunt nemultumiti contractual.`;
  return "Lotul este stabil contractual.";
}
