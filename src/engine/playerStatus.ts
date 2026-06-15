import type { FixtureResult } from "./leagueSimulation";
import { clamp } from "./random";
import { Player, PlayerInjury, Team } from "./types";

export interface PlayerStatusChange {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  fitnessBefore: number;
  fitnessAfter: number;
  moraleBefore: number;
  moraleAfter: number;
  injuryBefore?: PlayerInjury;
  injuryAfter?: PlayerInjury;
  note: string;
}

export interface RoundStatusReport {
  seasonNumber: number;
  round: number;
  summary: string;
  changes: PlayerStatusChange[];
}

const INJURY_LABELS = ["lovitura usoara", "intindere musculara", "glezna sensibila", "problema la genunchi"];

function getDeterministicScore(seed: string): number {
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return Math.abs(hash >>> 0) % 100;
}

export function clampStatus(value: number): number {
  return Math.round(clamp(value, 0, 100));
}

export function normalizePlayerStatus(player: Player): Player {
  const fitness = typeof player.fitness === "number" ? clampStatus(player.fitness) : 100;
  const injury = player.injury && player.injury.roundsRemaining > 0 ? player.injury : undefined;

  return {
    ...player,
    morale: clampStatus(player.morale),
    form: clampStatus(player.form),
    fitness,
    injury,
  };
}

export function normalizeTeamStatus(team: Team): Team {
  const players = team.players.map(normalizePlayerStatus);
  const avgMorale = players.reduce((total, player) => total + player.morale, 0) / players.length;

  return {
    ...team,
    players,
    morale: clampStatus(avgMorale || team.morale),
  };
}

export function isPlayerInjured(player: Player): boolean {
  return Boolean(player.injury && player.injury.roundsRemaining > 0);
}

export function getPlayerAvailabilityLabel(player: Player): string {
  if (isPlayerInjured(player)) {
    return `${player.injury?.label ?? "accidentat"} (${player.injury?.roundsRemaining ?? 1} runde)`;
  }

  const fitness = player.fitness ?? 100;
  if (fitness < 55) return "foarte obosit";
  if (fitness < 70) return "obosit";
  return "disponibil";
}

function recoverPlayerBeforeRound(player: Player, seasonNumber: number, round: number): Player {
  const normalized = normalizePlayerStatus(player);
  const recoveryScore = getDeterministicScore(`${player.id}:recovery:s${seasonNumber}:r${round}`);
  const agePenalty = normalized.age >= 32 ? 2 : normalized.age >= 29 ? 1 : 0;
  const staminaBonus = normalized.stamina >= 78 ? 2 : normalized.stamina >= 70 ? 1 : 0;
  const recovery = 8 + (recoveryScore % 4) + staminaBonus - agePenalty;
  const injury = normalized.injury
    ? {
        ...normalized.injury,
        roundsRemaining: normalized.injury.roundsRemaining - 1,
      }
    : undefined;

  return {
    ...normalized,
    fitness: clampStatus((normalized.fitness ?? 100) + recovery),
    injury: injury && injury.roundsRemaining > 0 ? injury : undefined,
  };
}

function getRoundImpactForTeam(result: FixtureResult, teamId: string): { goalDifference: number; moraleDelta: number } {
  const isHome = result.result.homeTeamId === teamId;
  const goalsFor = isHome ? result.result.homeScore : result.result.awayScore;
  const goalsAgainst = isHome ? result.result.awayScore : result.result.homeScore;
  const goalDifference = goalsFor - goalsAgainst;

  if (goalDifference > 0) return { goalDifference, moraleDelta: goalDifference >= 3 ? 5 : 3 };
  if (goalDifference === 0) return { goalDifference, moraleDelta: 1 };
  return { goalDifference, moraleDelta: goalDifference <= -3 ? -5 : -3 };
}

function getFitnessDrop(player: Player, seasonNumber: number, round: number, teamId: string): number {
  const score = getDeterministicScore(`${teamId}:${player.id}:fatigue:s${seasonNumber}:r${round}`);
  const agePenalty = player.age >= 33 ? 2 : player.age >= 30 ? 1 : 0;
  const staminaReduction = player.stamina >= 80 ? 2 : player.stamina >= 72 ? 1 : 0;
  const positionLoad = player.position === "MID" ? 1 : player.position === "ATT" ? 1 : 0;

  return Math.max(3, 5 + (score % 6) + agePenalty + positionLoad - staminaReduction);
}

function createInjuryIfNeeded(
  player: Player,
  nextFitness: number,
  seasonNumber: number,
  round: number,
  teamId: string
): PlayerInjury | undefined {
  if (isPlayerInjured(player)) return player.injury;

  const roll = getDeterministicScore(`${teamId}:${player.id}:injury:s${seasonNumber}:r${round}`);
  const risk =
    2 +
    (nextFitness < 75 ? 3 : 0) +
    (nextFitness < 60 ? 4 : 0) +
    (nextFitness < 45 ? 5 : 0) +
    (player.age >= 32 ? 2 : 0) +
    (player.stamina < 65 ? 2 : 0);

  if (roll >= risk) return undefined;

  const severity = roll % 3 === 0 ? "moderate" : "minor";
  const roundsRemaining = severity === "moderate" ? 2 + (roll % 2) : 1;
  const label = INJURY_LABELS[roll % INJURY_LABELS.length];

  return {
    severity,
    label,
    roundsRemaining,
  };
}

function applyMatchImpactToPlayer(
  player: Player,
  team: Team,
  seasonNumber: number,
  round: number,
  moraleDelta: number
): { player: Player; change?: PlayerStatusChange } {
  const normalized = normalizePlayerStatus(player);
  const fitnessBefore = normalized.fitness ?? 100;
  const moraleBefore = normalized.morale;
  const injuryBefore = normalized.injury;
  const drop = isPlayerInjured(normalized) ? 1 : getFitnessDrop(normalized, seasonNumber, round, team.id);
  const fitnessAfter = clampStatus(fitnessBefore - drop);
  const injuryAfter = createInjuryIfNeeded(normalized, fitnessAfter, seasonNumber, round, team.id);
  const moraleAfter = clampStatus(moraleBefore + moraleDelta);
  const formDelta = moraleDelta > 1 ? 2 : moraleDelta < 0 ? -2 : 1;
  const playerAfter: Player = {
    ...normalized,
    fitness: fitnessAfter,
    morale: moraleAfter,
    form: clampStatus(normalized.form + formDelta),
    injury: injuryAfter,
  };

  const importantChange =
    Math.abs(fitnessBefore - fitnessAfter) >= 8 ||
    moraleBefore !== moraleAfter ||
    injuryBefore?.roundsRemaining !== injuryAfter?.roundsRemaining ||
    injuryBefore?.label !== injuryAfter?.label;

  if (!importantChange) {
    return { player: playerAfter };
  }

  const note = injuryAfter && !injuryBefore
    ? `Accidentare: ${injuryAfter.label}, ${injuryAfter.roundsRemaining} runde.`
    : moraleDelta > 0
      ? "Moral crescut dupa rezultat."
      : moraleDelta < 0
        ? "Moral scazut dupa rezultat."
        : "Fitness actualizat dupa meci.";

  return {
    player: playerAfter,
    change: {
      playerId: player.id,
      playerName: player.name,
      teamId: team.id,
      teamName: team.name,
      fitnessBefore,
      fitnessAfter,
      moraleBefore,
      moraleAfter,
      injuryBefore,
      injuryAfter,
      note,
    },
  };
}

export function getAverageFitness(team: Team): number {
  if (team.players.length === 0) return 100;
  return Math.round(
    team.players.reduce((total, player) => total + (player.fitness ?? 100), 0) / team.players.length
  );
}

export function getUnavailablePlayers(team: Team): Player[] {
  return team.players.filter((player) => isPlayerInjured(player) || (player.fitness ?? 100) < 55);
}

export function applyRoundStatusEffects(
  teams: Team[],
  roundResults: FixtureResult[],
  seasonNumber: number,
  round: number
): { teams: Team[]; report: RoundStatusReport } {
  const recoveredTeams = teams.map((team) => ({
    ...normalizeTeamStatus(team),
    players: normalizeTeamStatus(team).players.map((player) => recoverPlayerBeforeRound(player, seasonNumber, round)),
  }));

  const resultByTeamId = new Map<string, FixtureResult>();
  for (const result of roundResults) {
    resultByTeamId.set(result.result.homeTeamId, result);
    resultByTeamId.set(result.result.awayTeamId, result);
  }

  const changes: PlayerStatusChange[] = [];
  const updatedTeams = recoveredTeams.map((team) => {
    const result = resultByTeamId.get(team.id);

    if (!result) {
      const players = team.players.map((player) => ({
        ...player,
        fitness: clampStatus((player.fitness ?? 100) + 4),
      }));
      return { ...team, players, morale: clampStatus(team.morale + 1) };
    }

    const { moraleDelta } = getRoundImpactForTeam(result, team.id);
    const playerResults = team.players.map((player) =>
      applyMatchImpactToPlayer(player, team, seasonNumber, round, moraleDelta)
    );
    const players = playerResults.map((item) => item.player);

    for (const item of playerResults) {
      if (item.change) changes.push(item.change);
    }

    const avgMorale = players.reduce((total, player) => total + player.morale, 0) / players.length;

    return {
      ...team,
      players,
      morale: clampStatus(avgMorale),
    };
  });

  const injuries = changes.filter((change) => change.injuryAfter && !change.injuryBefore).length;
  const avgFitness = Math.round(
    updatedTeams.reduce((total, team) => total + getAverageFitness(team), 0) / updatedTeams.length
  );

  return {
    teams: updatedTeams,
    report: {
      seasonNumber,
      round,
      summary: `Status actualizat: fitness mediu liga ${avgFitness}, accidentari noi ${injuries}.`,
      changes: changes
        .sort((first, second) => {
          const firstInjury = first.injuryAfter && !first.injuryBefore ? 1 : 0;
          const secondInjury = second.injuryAfter && !second.injuryBefore ? 1 : 0;
          return secondInjury - firstInjury || first.fitnessAfter - second.fitnessAfter;
        })
        .slice(0, 14),
    },
  };
}
