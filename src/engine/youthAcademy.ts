import { clamp, createSeededRandom, randomInt } from "./random";
import type { Player, Position, Team } from "./types";

export type AcademyRecordType = "scout" | "promote" | "upgrade";

export interface YouthProspect extends Player {
  potential: number;
  academyLevel: number;
  readiness: number;
  promotionCost: number;
}

export interface YouthAcademyState {
  level: number;
  prospects: YouthProspect[];
  lastScoutRoundKey?: string;
}

export interface YouthAcademyRecord {
  id: string;
  type: AcademyRecordType;
  seasonNumber: number;
  round: number;
  playerId?: string;
  playerName?: string;
  position?: Position;
  age?: number;
  overall?: number;
  potential?: number;
  cost: number;
  summary: string;
}

const firstNames = [
  "Andrei",
  "Rares",
  "Vlad",
  "Mihnea",
  "Tiberiu",
  "Iustin",
  "Alex",
  "Cristi",
  "Mario",
  "Eduard",
  "Darius",
  "Florin",
];

const lastNames = [
  "Ionescu",
  "Marin",
  "Popa",
  "Stoica",
  "Gheorghe",
  "Stan",
  "Enache",
  "Preda",
  "Ilie",
  "Savu",
  "Neagu",
  "Mocanu",
];

const positionCycle: Position[] = ["GK", "DEF", "MID", "ATT", "DEF", "MID", "ATT", "MID"];

export function getAcademyRoundCost(academy: YouthAcademyState): number {
  return 85 + academy.level * 35 + academy.prospects.length * 8;
}

export function getScoutingCost(academy: YouthAcademyState): number {
  return 260 + academy.level * 95;
}

export function getAcademyUpgradeCost(academy: YouthAcademyState): number {
  if (academy.level >= 5) return 0;
  return 1900 + academy.level * 1250;
}

function getProspectPotential(overall: number, age: number, academyLevel: number, seedBonus: number): number {
  const ageBonus = age <= 16 ? 16 : age === 17 ? 12 : 8;
  return clamp(overall + ageBonus + academyLevel * 2 + seedBonus, overall + 3, 92);
}

function getReadiness(overall: number, potential: number, age: number): number {
  const maturity = age >= 18 ? 12 : age === 17 ? 7 : 3;
  return clamp(Math.round(overall * 0.74 + maturity - Math.max(0, potential - overall) * 0.18), 1, 100);
}

function getPromotionCost(overall: number, potential: number, academyLevel: number): number {
  const raw = 260 + overall * 7 + Math.max(0, potential - overall) * 20 - academyLevel * 35;
  return Math.max(350, Math.round(raw / 25) * 25);
}

function createYouthProspect(seasonNumber: number, round: number, academyLevel: number, index: number): YouthProspect {
  const random = createSeededRandom(`youth:${seasonNumber}:${round}:${academyLevel}:${index}`);
  const position = positionCycle[(index + academyLevel) % positionCycle.length];
  const age = randomInt(random, 16, 18);
  const levelBoost = academyLevel * 2;
  const overall = clamp(randomInt(random, 48, 60) + levelBoost + randomInt(random, -2, 3), 45, 70);
  const potential = getProspectPotential(overall, age, academyLevel, randomInt(random, -2, 7));

  const player: Player = {
    id: `yp-s${seasonNumber}-r${round}-l${academyLevel}-${index}`,
    name: `${firstNames[randomInt(random, 0, firstNames.length - 1)]} ${lastNames[randomInt(random, 0, lastNames.length - 1)]}`,
    position,
    age,
    overall,
    pace: clamp(overall + randomInt(random, -4, 9), 42, 82),
    shooting: clamp(overall + (position === "ATT" ? randomInt(random, 0, 8) : randomInt(random, -8, 4)), 35, 82),
    passing: clamp(overall + (position === "MID" ? randomInt(random, 0, 8) : randomInt(random, -6, 5)), 38, 82),
    defending: clamp(overall + (position === "DEF" || position === "GK" ? randomInt(random, 0, 8) : randomInt(random, -10, 3)), 34, 82),
    stamina: clamp(overall + randomInt(random, -4, 8), 42, 84),
    morale: randomInt(random, 68, 88),
    form: randomInt(random, 58, 78),
    fitness: randomInt(random, 90, 100),
  };

  return {
    ...player,
    potential,
    academyLevel,
    readiness: getReadiness(overall, potential, age),
    promotionCost: getPromotionCost(overall, potential, academyLevel),
  };
}

export function createYouthProspects(seasonNumber: number, round: number, academyLevel: number, count?: number): YouthProspect[] {
  const prospectCount = count ?? 4 + academyLevel;
  return Array.from({ length: prospectCount }, (_, index) => createYouthProspect(seasonNumber, round, academyLevel, index + 1));
}

export function createInitialYouthAcademy(seasonNumber: number): YouthAcademyState {
  return {
    level: 1,
    prospects: createYouthProspects(seasonNumber, 1, 1, 5),
    lastScoutRoundKey: undefined,
  };
}

export function getAcademyRoundKey(seasonNumber: number, round: number): string {
  return `s${seasonNumber}:r${round}`;
}

export function scoutYouthProspects(
  academy: YouthAcademyState,
  seasonNumber: number,
  round: number
): { academy: YouthAcademyState; record: YouthAcademyRecord } {
  const cost = getScoutingCost(academy);
  const nextAcademy = {
    ...academy,
    prospects: createYouthProspects(seasonNumber, round, academy.level),
    lastScoutRoundKey: getAcademyRoundKey(seasonNumber, round),
  };

  return {
    academy: nextAcademy,
    record: {
      id: `academy-scout-${seasonNumber}-${round}`,
      type: "scout",
      seasonNumber,
      round,
      cost,
      summary: `Scouting nou: ${nextAcademy.prospects.length} juniori gasiti la nivelul academiei ${academy.level}.`,
    },
  };
}

export function promoteYouthProspect(
  team: Team,
  academy: YouthAcademyState,
  prospectId: string,
  seasonNumber: number,
  round: number
): { team: Team; academy: YouthAcademyState; record: YouthAcademyRecord; cost: number } {
  if (team.players.length >= 25) {
    throw new Error("Lotul este plin. Vinde un jucator inainte sa promovezi un junior.");
  }

  const prospect = academy.prospects.find((item) => item.id === prospectId);
  if (!prospect) {
    throw new Error("Juniorul nu mai exista in academie.");
  }

  const promotedPlayer: Player = {
    id: `${team.id}-academy-${prospect.id}`,
    name: prospect.name,
    position: prospect.position,
    age: prospect.age,
    overall: prospect.overall,
    pace: prospect.pace,
    shooting: prospect.shooting,
    passing: prospect.passing,
    defending: prospect.defending,
    stamina: prospect.stamina,
    morale: clamp(prospect.morale + 2, 1, 100),
    form: prospect.form,
    fitness: prospect.fitness ?? 100,
    wage: Math.max(6, Math.round((prospect.overall * 0.38 + prospect.potential * 0.12) / 2)),
    contract: {
      wage: Math.max(6, Math.round((prospect.overall * 0.38 + prospect.potential * 0.12) / 2)),
      signedSeason: seasonNumber,
      expiresSeason: seasonNumber + 4,
      happiness: 82,
    },
  };

  return {
    team: {
      ...team,
      players: [...team.players, promotedPlayer],
      morale: clamp(team.morale + 1, 1, 100),
    },
    academy: {
      ...academy,
      prospects: academy.prospects.filter((item) => item.id !== prospectId),
    },
    cost: prospect.promotionCost,
    record: {
      id: `academy-promote-${seasonNumber}-${round}-${prospect.id}`,
      type: "promote",
      seasonNumber,
      round,
      playerId: promotedPlayer.id,
      playerName: promotedPlayer.name,
      position: promotedPlayer.position,
      age: promotedPlayer.age,
      overall: promotedPlayer.overall,
      potential: prospect.potential,
      cost: prospect.promotionCost,
      summary: `${promotedPlayer.name} a fost promovat in lotul mare. OVR ${promotedPlayer.overall}, potential ${prospect.potential}.`,
    },
  };
}

export function upgradeYouthAcademy(
  academy: YouthAcademyState,
  seasonNumber: number,
  round: number
): { academy: YouthAcademyState; record: YouthAcademyRecord; cost: number } {
  if (academy.level >= 5) {
    throw new Error("Academia este deja la nivel maxim.");
  }

  const cost = getAcademyUpgradeCost(academy);
  const nextLevel = academy.level + 1;

  return {
    academy: {
      ...academy,
      level: nextLevel,
    },
    cost,
    record: {
      id: `academy-upgrade-${seasonNumber}-${round}-l${nextLevel}`,
      type: "upgrade",
      seasonNumber,
      round,
      cost,
      summary: `Academia a fost imbunatatita la nivelul ${nextLevel}. Prospectii viitori vor avea calitate mai buna.`,
    },
  };
}
