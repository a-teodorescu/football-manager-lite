import { clamp, createSeededRandom, randomInt } from "./random";
import { createPlayerIdentity, normalizePlayerIdentity } from "./playerIdentity";
import type { Player, Position, Team } from "./types";

export interface TransferMarketPlayer extends Player {
  value: number;
  wage: number;
  askingClub: string;
}

export type TransferRecordType = "buy" | "sell";

export interface TransferRecord {
  id: string;
  type: TransferRecordType;
  playerId: string;
  playerName: string;
  position: Position;
  age: number;
  overall: number;
  value: number;
  seasonNumber: number;
  round: number;
  budgetAfter: number;
}

const firstNames = [
  "Luca",
  "Matei",
  "David",
  "Sebastian",
  "Stefan",
  "Robert",
  "Antonio",
  "Victor",
  "Denis",
  "Tudor",
  "Marco",
  "Nicolas",
];

const lastNames = [
  "Radu",
  "Munteanu",
  "Petrescu",
  "Dobre",
  "Serban",
  "Coman",
  "Toma",
  "Nistor",
  "Barbu",
  "Roman",
  "Lazar",
  "Dragomir",
];

const agentClubs = [
  "Free Agent",
  "Academy Release",
  "Contract Expired",
  "Trialist Pool",
  "Regional Scout",
];

const positionCycle: Position[] = ["GK", "DEF", "DEF", "MID", "MID", "ATT", "DEF", "MID", "ATT", "GK", "MID", "ATT"];

function getAgeValueModifier(age: number): number {
  if (age <= 21) return 1.38;
  if (age <= 24) return 1.24;
  if (age <= 28) return 1.08;
  if (age <= 31) return 0.94;
  if (age <= 34) return 0.72;
  return 0.52;
}

function getPositionValueModifier(position: Position): number {
  if (position === "ATT") return 1.18;
  if (position === "MID") return 1.08;
  if (position === "DEF") return 0.98;
  return 0.88;
}

export function getInitialTransferBudget(seasonNumber: number): number {
  return 12000 + Math.max(0, seasonNumber - 1) * 1800;
}

export function formatMoney(value: number): string {
  return `€${value.toLocaleString("en-US")}k`;
}

export function estimatePlayerValue(player: Player): number {
  const raw =
    player.overall *
    player.overall *
    0.82 *
    getAgeValueModifier(player.age) *
    getPositionValueModifier(player.position);

  return Math.max(150, Math.round(raw / 25) * 25);
}

export function estimatePlayerWage(player: Player): number {
  return Math.max(8, Math.round((player.overall * 0.55 + player.age * 0.18) * getPositionValueModifier(player.position)));
}

function createMarketPlayer(seasonNumber: number, round: number, index: number): TransferMarketPlayer {
  const random = createSeededRandom(`transfer_market:${seasonNumber}:${round}:${index}`);
  const position = positionCycle[index % positionCycle.length];
  const age = randomInt(random, 18, 35);
  const baseOverall = randomInt(random, 61, 78);
  const potentialBias = age <= 22 ? randomInt(random, 0, 4) : randomInt(random, -2, 2);
  const overall = clamp(baseOverall + potentialBias, 58, 81);

  const player = normalizePlayerIdentity({
    id: `fa-s${seasonNumber}-r${round}-${index}`,
    ...createPlayerIdentity({
      seed: `transfer:${seasonNumber}:${round}:${index}`,
      index,
      position,
      age,
      overall,
    }),
    position,
    age,
    overall,
    pace: clamp(overall + randomInt(random, -6, 7), 45, 88),
    shooting: clamp(overall + (position === "ATT" ? randomInt(random, 1, 8) : randomInt(random, -9, 3)), 38, 88),
    passing: clamp(overall + (position === "MID" ? randomInt(random, 1, 8) : randomInt(random, -6, 4)), 42, 88),
    defending: clamp(overall + (position === "DEF" || position === "GK" ? randomInt(random, 1, 8) : randomInt(random, -12, 1)), 35, 88),
    stamina: clamp(overall + randomInt(random, -5, 6), 45, 88),
    morale: randomInt(random, 62, 84),
    form: randomInt(random, 60, 82),
    fitness: randomInt(random, 88, 100),
  });

  return {
    ...player,
    value: estimatePlayerValue(player),
    wage: estimatePlayerWage(player),
    askingClub: agentClubs[randomInt(random, 0, agentClubs.length - 1)],
  };
}

export function createFreeAgentMarket(seasonNumber: number, round: number, count = 12): TransferMarketPlayer[] {
  return Array.from({ length: count }, (_, index) => createMarketPlayer(seasonNumber, round, index + 1));
}

function countPlayersByPosition(team: Team, position: Position): number {
  return team.players.filter((player) => player.position === position).length;
}

export function getSellBlockReason(team: Team, playerId: string): string | null {
  const player = team.players.find((item) => item.id === playerId);
  if (!player) return "Jucatorul nu mai exista in lot.";

  if (team.players.length <= 14) {
    return "Nu poti vinde: lotul trebuie sa ramana cu minimum 14 jucatori.";
  }

  const minimumByPosition: Record<Position, number> = {
    GK: 1,
    DEF: 4,
    MID: 4,
    ATT: 2,
  };

  if (countPlayersByPosition(team, player.position) <= minimumByPosition[player.position]) {
    return `Nu poti vinde: ai nevoie de minimum ${minimumByPosition[player.position]} jucatori pe postul ${player.position}.`;
  }

  return null;
}

export function buyMarketPlayer(
  team: Team,
  marketPlayer: TransferMarketPlayer,
  budget: number,
  seasonNumber: number,
  round: number
): { team: Team; budget: number; record: TransferRecord } {
  if (marketPlayer.value > budget) {
    throw new Error("Buget insuficient pentru acest transfer.");
  }

  if (team.players.length >= 25) {
    throw new Error("Lotul este plin. Vinde un jucator inainte sa cumperi altul.");
  }

  const contractYears = marketPlayer.age >= 32 ? 1 : marketPlayer.age <= 23 ? 4 : 3;
  const signedPlayer: Player = normalizePlayerIdentity({
    ...marketPlayer,
    id: `${team.id}-signed-${marketPlayer.id}`,
    morale: clamp(marketPlayer.morale + 4, 1, 100),
    fitness: marketPlayer.fitness ?? 100,
    wage: marketPlayer.wage,
    contract: {
      wage: marketPlayer.wage,
      signedSeason: seasonNumber,
      expiresSeason: seasonNumber + contractYears,
      happiness: 78,
    },
  });
  const nextBudget = budget - marketPlayer.value;

  return {
    team: {
      ...team,
      players: [...team.players, signedPlayer],
      morale: clamp(team.morale + 1, 1, 100),
    },
    budget: nextBudget,
    record: {
      id: `buy-${seasonNumber}-${round}-${marketPlayer.id}`,
      type: "buy",
      playerId: signedPlayer.id,
      playerName: signedPlayer.name,
      position: signedPlayer.position,
      age: signedPlayer.age,
      overall: signedPlayer.overall,
      value: marketPlayer.value,
      seasonNumber,
      round,
      budgetAfter: nextBudget,
    },
  };
}

export function sellSquadPlayer(
  team: Team,
  playerId: string,
  budget: number,
  seasonNumber: number,
  round: number
): { team: Team; budget: number; record: TransferRecord } {
  const blockReason = getSellBlockReason(team, playerId);
  if (blockReason) {
    throw new Error(blockReason);
  }

  const player = team.players.find((item) => item.id === playerId);
  if (!player) {
    throw new Error("Jucatorul nu mai exista in lot.");
  }

  const saleValue = Math.round(estimatePlayerValue(player) * 0.72 / 25) * 25;
  const nextBudget = budget + saleValue;

  return {
    team: {
      ...team,
      players: team.players.filter((item) => item.id !== playerId),
      morale: clamp(team.morale - 1, 1, 100),
    },
    budget: nextBudget,
    record: {
      id: `sell-${seasonNumber}-${round}-${player.id}`,
      type: "sell",
      playerId: player.id,
      playerName: player.name,
      position: player.position,
      age: player.age,
      overall: player.overall,
      value: saleValue,
      seasonNumber,
      round,
      budgetAfter: nextBudget,
    },
  };
}
