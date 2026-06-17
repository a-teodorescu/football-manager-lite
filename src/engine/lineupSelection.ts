import type { Formation, Player, Position, Team } from "./types";
import { isPlayerInjured, normalizePlayerStatus } from "./playerStatus";

export interface FormationSlots {
  GK: number;
  DEF: number;
  MID: number;
  ATT: number;
}

export interface LineupValidationIssue {
  severity: "ok" | "warning" | "danger";
  message: string;
}

export interface LineupValidationReport {
  selectedPlayerIds: string[];
  selectedPlayers: Player[];
  benchPlayers: Player[];
  slots: FormationSlots;
  isValid: boolean;
  score: number;
  issues: LineupValidationIssue[];
  positionCounts: Record<Position, number>;
  summary: string;
}

const POSITIONS: Position[] = ["GK", "DEF", "MID", "ATT"];

export function getFormationSlots(formation: Formation): FormationSlots {
  if (formation === "4-4-2") return { GK: 1, DEF: 4, MID: 4, ATT: 2 };
  if (formation === "4-3-3") return { GK: 1, DEF: 4, MID: 3, ATT: 3 };
  if (formation === "5-3-2") return { GK: 1, DEF: 5, MID: 3, ATT: 2 };
  return { GK: 1, DEF: 4, MID: 4, ATT: 2 };
}

function getPlayerAvailabilityScore(player: Player): number {
  const normalized = normalizePlayerStatus(player);
  const fitness = normalized.fitness ?? 100;
  const injuryPenalty = isPlayerInjured(normalized) ? 32 : 0;
  const lowFitnessPenalty = fitness < 55 ? 10 : 0;

  return Math.round(
    normalized.overall * 1.8 +
      normalized.form * 0.35 +
      normalized.morale * 0.25 +
      fitness * 0.2 -
      injuryPenalty -
      lowFitnessPenalty,
  );
}

function sortLineupCandidates(players: Player[]): Player[] {
  return [...players].sort((a, b) => {
    const scoreDelta = getPlayerAvailabilityScore(b) - getPlayerAvailabilityScore(a);
    if (scoreDelta !== 0) return scoreDelta;
    return b.overall - a.overall;
  });
}

function takeBestByPosition(
  players: Player[],
  position: Position,
  count: number,
  selectedIds: Set<string>,
): Player[] {
  const candidates = sortLineupCandidates(
    players.filter((player) => player.position === position && !selectedIds.has(player.id)),
  );
  const selected = candidates.slice(0, count);
  selected.forEach((player) => selectedIds.add(player.id));
  return selected;
}

export function buildDefaultLineupPlayerIds(team: Team, formation: Formation): string[] {
  const normalizedPlayers = team.players.map(normalizePlayerStatus);
  const slots = getFormationSlots(formation);
  const selectedIds = new Set<string>();
  const selected: Player[] = [];

  for (const position of POSITIONS) {
    selected.push(...takeBestByPosition(normalizedPlayers, position, slots[position], selectedIds));
  }

  if (selected.length < 11) {
    const fallback = sortLineupCandidates(
      normalizedPlayers.filter((player) => !selectedIds.has(player.id)),
    ).slice(0, 11 - selected.length);
    fallback.forEach((player) => selectedIds.add(player.id));
    selected.push(...fallback);
  }

  return selected.slice(0, 11).map((player) => player.id);
}

function normalizeSelectedIds(team: Team): string[] {
  const validIds = new Set(team.players.map((player) => player.id));
  const unique: string[] = [];

  for (const playerId of team.lineupPlayerIds ?? []) {
    if (validIds.has(playerId) && !unique.includes(playerId)) {
      unique.push(playerId);
    }
  }

  return unique.slice(0, 11);
}

export function getSelectedLineupPlayerIds(team: Team, formation: Formation): string[] {
  const normalized = normalizeSelectedIds(team);
  return normalized.length > 0 ? normalized : buildDefaultLineupPlayerIds(team, formation);
}

export function getActiveLineupPlayers(team: Team): Player[] {
  const selectedIds = normalizeSelectedIds(team);
  if (selectedIds.length === 0) return sortLineupCandidates(team.players).slice(0, 11);

  const selectedSet = new Set(selectedIds);
  const selectedPlayers = team.players.filter((player) => selectedSet.has(player.id));
  return selectedPlayers.length > 0 ? selectedPlayers : sortLineupCandidates(team.players).slice(0, 11);
}

export function applyLineupSelectionToTeam(team: Team, selectedPlayerIds: string[]): Team {
  const validIds = new Set(team.players.map((player) => player.id));
  const lineupPlayerIds: string[] = [];

  for (const playerId of selectedPlayerIds) {
    if (validIds.has(playerId) && !lineupPlayerIds.includes(playerId)) {
      lineupPlayerIds.push(playerId);
    }
  }

  return {
    ...team,
    lineupPlayerIds: lineupPlayerIds.slice(0, 11),
    substitutionPlan: [],
  };
}

export function autoPickLineup(team: Team, formation: Formation): Team {
  return applyLineupSelectionToTeam(team, buildDefaultLineupPlayerIds(team, formation));
}

export function toggleLineupPlayer(team: Team, playerId: string, formation: Formation): Team {
  const current = getSelectedLineupPlayerIds(team, formation);
  const next = current.includes(playerId)
    ? current.filter((id) => id !== playerId)
    : [...current, playerId].slice(0, 11);

  return applyLineupSelectionToTeam(team, next);
}

function countPositions(players: Player[]): Record<Position, number> {
  return POSITIONS.reduce(
    (acc, position) => ({
      ...acc,
      [position]: players.filter((player) => player.position === position).length,
    }),
    { GK: 0, DEF: 0, MID: 0, ATT: 0 } as Record<Position, number>,
  );
}

export function validateLineupSelection(team: Team, formation: Formation): LineupValidationReport {
  const selectedPlayerIds = getSelectedLineupPlayerIds(team, formation);
  const selectedIdSet = new Set(selectedPlayerIds);
  const selectedPlayers = team.players.filter((player) => selectedIdSet.has(player.id));
  const benchPlayers = team.players.filter((player) => !selectedIdSet.has(player.id));
  const slots = getFormationSlots(formation);
  const positionCounts = countPositions(selectedPlayers);
  const issues: LineupValidationIssue[] = [];

  if (selectedPlayers.length !== 11) {
    issues.push({
      severity: "danger",
      message: `Primul 11 are ${selectedPlayers.length}/11 jucatori selectati.`,
    });
  }

  for (const position of POSITIONS) {
    if (positionCounts[position] < slots[position]) {
      issues.push({
        severity: position === "GK" ? "danger" : "warning",
        message: `Ai nevoie de ${slots[position]} ${position}, dar ai selectat ${positionCounts[position]}.`,
      });
    }
  }

  const injuredStarters = selectedPlayers.filter(isPlayerInjured);
  if (injuredStarters.length > 0) {
    issues.push({
      severity: "warning",
      message: `${injuredStarters.length} titular(i) sunt accidentati si vor reduce forta echipei.`,
    });
  }

  const tiredStarters = selectedPlayers.filter((player) => (player.fitness ?? 100) < 55);
  if (tiredStarters.length > 0) {
    issues.push({
      severity: "warning",
      message: `${tiredStarters.length} titular(i) au fitness sub 55.`,
    });
  }

  if (issues.length === 0) {
    issues.push({ severity: "ok", message: "Primul 11 este pregatit pentru urmatorul meci." });
  }

  const scorePenalty = issues.reduce((total, issue) => total + (issue.severity === "danger" ? 25 : issue.severity === "warning" ? 9 : 0), 0);
  const score = Math.max(0, 100 - scorePenalty);
  const isValid = selectedPlayers.length === 11 && !issues.some((issue) => issue.severity === "danger");

  return {
    selectedPlayerIds,
    selectedPlayers,
    benchPlayers,
    slots,
    isValid,
    score,
    issues,
    positionCounts,
    summary: isValid
      ? `Lineup valid pentru ${formation}: ${selectedPlayers.length}/11 titulari.`
      : `Lineup incomplet sau riscant pentru ${formation}.`,
  };
}
