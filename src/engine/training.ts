import { clampStatus, normalizePlayerStatus } from "./playerStatus";
import type { Player, Team } from "./types";

export type TrainingFocus = "balanced" | "attacking" | "defensive" | "fitness";

export interface PlayerTrainingChange {
  playerId: string;
  playerName: string;
  position: Player["position"];
  overallBefore: number;
  overallAfter: number;
  improvedAttributes: string[];
}

export interface TrainingSessionResult {
  seasonNumber: number;
  round: number;
  focus: TrainingFocus;
  summary: string;
  changes: PlayerTrainingChange[];
}

const FOCUS_LABELS: Record<TrainingFocus, string> = {
  balanced: "Balanced",
  attacking: "Attacking",
  defensive: "Defensive",
  fitness: "Fitness",
};

function clampRating(value: number): number {
  return Math.max(1, Math.min(99, Math.round(value)));
}

function getDeterministicScore(seed: string): number {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 9973;
  }

  return hash % 100;
}

function getYouthBonus(age: number): number {
  if (age <= 21) return 2;
  if (age <= 25) return 1;
  if (age >= 33) return -1;
  return 0;
}

function getFocusAttributes(player: Player, focus: TrainingFocus): Array<keyof Player> {
  if (focus === "attacking") {
    if (player.position === "ATT") return ["shooting", "pace", "passing", "form"];
    if (player.position === "MID") return ["passing", "shooting", "stamina", "form"];
    return ["passing", "stamina", "form"];
  }

  if (focus === "defensive") {
    if (player.position === "GK") return ["defending", "stamina", "morale", "form"];
    if (player.position === "DEF") return ["defending", "stamina", "pace", "form"];
    if (player.position === "MID") return ["defending", "passing", "stamina", "form"];
    return ["stamina", "morale", "form"];
  }

  if (focus === "fitness") {
    return ["stamina", "pace", "form", "morale"];
  }

  if (player.position === "GK") return ["defending", "passing", "stamina", "morale"];
  if (player.position === "DEF") return ["defending", "passing", "stamina", "form"];
  if (player.position === "MID") return ["passing", "stamina", "shooting", "form"];
  return ["shooting", "pace", "stamina", "form"];
}

export function calculatePlayerOverall(player: Player): number {
  if (player.position === "GK") {
    return clampRating(
      player.defending * 0.5 + player.stamina * 0.18 + player.passing * 0.12 + player.morale * 0.1 + player.form * 0.1
    );
  }

  if (player.position === "DEF") {
    return clampRating(
      player.defending * 0.45 + player.stamina * 0.2 + player.passing * 0.15 + player.pace * 0.1 + player.form * 0.1
    );
  }

  if (player.position === "MID") {
    return clampRating(
      player.passing * 0.35 + player.stamina * 0.2 + player.defending * 0.15 + player.shooting * 0.15 + player.form * 0.15
    );
  }

  return clampRating(
    player.shooting * 0.4 + player.pace * 0.2 + player.passing * 0.15 + player.stamina * 0.1 + player.form * 0.15
  );
}

function trainPlayer(player: Player, focus: TrainingFocus, seasonNumber: number, round: number, facilityBonus = 0): PlayerTrainingChange & { player: Player } {
  const seed = `${player.id}:${focus}:s${seasonNumber}:r${round}`;
  const score = getDeterministicScore(seed);
  const youthBonus = getYouthBonus(player.age);
  const attributes = getFocusAttributes(player, focus);
  const improvedAttributes: string[] = [];
  const nextPlayer: Player = normalizePlayerStatus(player);

  attributes.forEach((attribute, index) => {
    const baseChance = focus === "balanced" ? 46 : 54;
    const positionBonus = index === 0 ? 16 : index === 1 ? 8 : 0;
    const chance = baseChance + positionBonus + youthBonus * 7 + facilityBonus;
    const attributeRoll = (score + index * 23) % 100;

    if (attributeRoll < chance) {
      const currentValue = nextPlayer[attribute];
      if (typeof currentValue === "number") {
        const delta = youthBonus >= 2 && attributeRoll < 18 ? 2 : 1;
        nextPlayer[attribute] = clampRating(currentValue + delta) as never;
        improvedAttributes.push(attribute);
      }
    }
  });

  if (focus === "fitness") {
    const fitnessBefore = nextPlayer.fitness ?? 100;
    nextPlayer.fitness = clampStatus(fitnessBefore + 8 + (score % 5) + Math.round(facilityBonus / 2));
    nextPlayer.morale = clampRating(nextPlayer.morale + 1);
    if (nextPlayer.fitness > fitnessBefore) {
      improvedAttributes.push("fitness");
    }
    if (nextPlayer.injury && score < 35) {
      const roundsRemaining = nextPlayer.injury.roundsRemaining - 1;
      nextPlayer.injury = roundsRemaining > 0 ? { ...nextPlayer.injury, roundsRemaining } : undefined;
      improvedAttributes.push("recovery");
    }
  }

  const overallBefore = player.overall;
  nextPlayer.overall = calculatePlayerOverall(nextPlayer);

  return {
    player: nextPlayer,
    playerId: player.id,
    playerName: player.name,
    position: player.position,
    overallBefore,
    overallAfter: nextPlayer.overall,
    improvedAttributes,
  };
}

export function runTeamTraining(
  team: Team,
  focus: TrainingFocus,
  seasonNumber: number,
  round: number,
  facilityBonus = 0
): { team: Team; result: TrainingSessionResult } {
  const trainedPlayers = team.players.map((player) => trainPlayer(player, focus, seasonNumber, round, facilityBonus));
  const players = trainedPlayers.map((item) => item.player);
  const changes = trainedPlayers
    .filter((item) => item.improvedAttributes.length > 0 || item.overallAfter > item.overallBefore)
    .map(({ player: _player, ...change }) => change)
    .sort((first, second) => second.overallAfter - first.overallAfter)
    .slice(0, 8);

  const avgOverall = players.reduce((total, player) => total + player.overall, 0) / players.length;
  const avgMorale = players.reduce((total, player) => total + player.morale, 0) / players.length;

  return {
    team: {
      ...team,
      players,
      reputation: clampRating(avgOverall),
      morale: clampRating(avgMorale),
    },
    result: {
      seasonNumber,
      round,
      focus,
      summary: `${FOCUS_LABELS[focus]} training completed: ${changes.length} key improvements${facilityBonus > 0 ? `, facilities bonus +${facilityBonus}%` : ""}.`,
      changes,
    },
  };
}

export function getTrainingFocusLabel(focus: TrainingFocus): string {
  return FOCUS_LABELS[focus];
}
