import type { Formation, Player, Position, SubstitutionInstruction, Team } from "./types";
import { getFormationSlots, getSelectedLineupPlayerIds } from "./lineupSelection";
import { isPlayerInjured, normalizePlayerStatus } from "./playerStatus";
import { clamp } from "./random";

export interface SubstitutionRecommendation {
  outPlayerId: string;
  outPlayerName: string;
  inPlayerId: string;
  inPlayerName: string;
  position: Position;
  minute: number;
  impact: number;
  reason: string;
}

export interface SubstitutionValidationIssue {
  severity: "ok" | "warning" | "danger";
  message: string;
}

export interface SubstitutionReport {
  planned: SubstitutionInstruction[];
  recommendations: SubstitutionRecommendation[];
  starters: Player[];
  bench: Player[];
  isValid: boolean;
  benchStrength: number;
  expectedImpact: number;
  issues: SubstitutionValidationIssue[];
  summary: string;
}

const MAX_SUBSTITUTIONS = 3;
const DEFAULT_SUB_MINUTES = [60, 68, 76];

function getPlayerScore(player: Player): number {
  const normalized = normalizePlayerStatus(player);
  const fitness = normalized.fitness ?? 100;
  const injuryPenalty = isPlayerInjured(normalized) ? 28 : 0;
  return Math.round(
    normalized.overall * 1.55 +
      normalized.form * 0.28 +
      normalized.morale * 0.18 +
      fitness * 0.25 -
      injuryPenalty,
  );
}

function getPlayerLateMatchRisk(player: Player): number {
  const fitness = player.fitness ?? 100;
  const injuryRisk = isPlayerInjured(player) ? 35 : 0;
  const staminaRisk = Math.max(0, 72 - player.stamina) * 0.45;
  const fitnessRisk = Math.max(0, 70 - fitness) * 0.65;
  const formRisk = Math.max(0, 62 - player.form) * 0.18;
  return Math.round(injuryRisk + staminaRisk + fitnessRisk + formRisk);
}

function getSubstitutionImpact(outPlayer: Player, inPlayer: Player): number {
  const freshnessBonus = Math.max(0, (inPlayer.fitness ?? 100) - (outPlayer.fitness ?? 100)) * 0.25;
  const lateRiskRelief = getPlayerLateMatchRisk(outPlayer) * 0.45;
  const qualityDelta = (getPlayerScore(inPlayer) - getPlayerScore(outPlayer)) * 0.16;
  const samePositionBonus = inPlayer.position === outPlayer.position ? 4 : -8;
  return Math.round(clamp(qualityDelta + freshnessBonus + lateRiskRelief + samePositionBonus, -20, 35));
}

function getSortedBenchForPosition(bench: Player[], position: Position, usedInIds: Set<string>): Player[] {
  return [...bench]
    .filter((player) => !usedInIds.has(player.id))
    .sort((a, b) => {
      const aSame = a.position === position ? 1 : 0;
      const bSame = b.position === position ? 1 : 0;
      if (aSame !== bSame) return bSame - aSame;
      return getPlayerScore(b) - getPlayerScore(a);
    });
}

function getRecommendedMinute(index: number, outPlayer: Player): number {
  if (isPlayerInjured(outPlayer)) return 46;
  if ((outPlayer.fitness ?? 100) < 55) return 55;
  return DEFAULT_SUB_MINUTES[index] ?? 76;
}

function getSubstitutionReason(outPlayer: Player, inPlayer: Player, impact: number): string {
  if (isPlayerInjured(outPlayer)) return "Protejeaza un titular accidentat.";
  if ((outPlayer.fitness ?? 100) < 55) return "Reduce riscul de oboseala in repriza a doua.";
  if (inPlayer.overall > outPlayer.overall) return "Introduce un jucator cu rating mai bun de pe banca.";
  if (impact >= 10) return "Banca aduce energie proaspata pentru final.";
  return "Rotatie echilibrata pentru mentinerea intensitatii.";
}

export function normalizeSubstitutionPlan(team: Team): SubstitutionInstruction[] {
  const playerIds = new Set(team.players.map((player) => player.id));
  const usedOut = new Set<string>();
  const usedIn = new Set<string>();
  const normalized: SubstitutionInstruction[] = [];

  for (const item of team.substitutionPlan ?? []) {
    const minute = Number.isFinite(item.minute) ? Math.round(item.minute) : 60;
    if (!playerIds.has(item.outPlayerId) || !playerIds.has(item.inPlayerId)) continue;
    if (item.outPlayerId === item.inPlayerId) continue;
    if (usedOut.has(item.outPlayerId) || usedIn.has(item.inPlayerId)) continue;

    normalized.push({
      outPlayerId: item.outPlayerId,
      inPlayerId: item.inPlayerId,
      minute: Math.round(clamp(minute, 1, 89)),
      reason: item.reason?.slice(0, 120),
    });
    usedOut.add(item.outPlayerId);
    usedIn.add(item.inPlayerId);

    if (normalized.length >= MAX_SUBSTITUTIONS) break;
  }

  return normalized.sort((a, b) => a.minute - b.minute);
}

export function getSubstitutionRecommendations(team: Team, formation: Formation): SubstitutionRecommendation[] {
  const selectedIds = getSelectedLineupPlayerIds(team, formation);
  const selectedIdSet = new Set(selectedIds);
  const starters = team.players.filter((player) => selectedIdSet.has(player.id));
  const bench = team.players.filter((player) => !selectedIdSet.has(player.id));
  const usedInIds = new Set<string>();
  const recommendations: SubstitutionRecommendation[] = [];
  const slots = getFormationSlots(formation);

  const candidateOut = [...starters]
    .filter((player) => player.position !== "GK" || slots.GK === 0)
    .sort((a, b) => {
      const riskDelta = getPlayerLateMatchRisk(b) - getPlayerLateMatchRisk(a);
      if (riskDelta !== 0) return riskDelta;
      return getPlayerScore(a) - getPlayerScore(b);
    });

  for (const outPlayer of candidateOut) {
    const benchCandidates = getSortedBenchForPosition(bench, outPlayer.position, usedInIds);
    const inPlayer = benchCandidates[0];
    if (!inPlayer) continue;

    const impact = getSubstitutionImpact(outPlayer, inPlayer);
    const index = recommendations.length;
    recommendations.push({
      outPlayerId: outPlayer.id,
      outPlayerName: outPlayer.name,
      inPlayerId: inPlayer.id,
      inPlayerName: inPlayer.name,
      position: outPlayer.position,
      minute: getRecommendedMinute(index, outPlayer),
      impact,
      reason: getSubstitutionReason(outPlayer, inPlayer, impact),
    });
    usedInIds.add(inPlayer.id);

    if (recommendations.length >= MAX_SUBSTITUTIONS) break;
  }

  return recommendations.sort((a, b) => b.impact - a.impact || a.minute - b.minute);
}

export function buildDefaultSubstitutionPlan(team: Team, formation: Formation): SubstitutionInstruction[] {
  return getSubstitutionRecommendations(team, formation)
    .slice(0, MAX_SUBSTITUTIONS)
    .sort((a, b) => a.minute - b.minute)
    .map((recommendation, index) => ({
      outPlayerId: recommendation.outPlayerId,
      inPlayerId: recommendation.inPlayerId,
      minute: recommendation.minute || DEFAULT_SUB_MINUTES[index] || 76,
      reason: recommendation.reason,
    }));
}

export function applySubstitutionPlanToTeam(team: Team, plan: SubstitutionInstruction[]): Team {
  return {
    ...team,
    substitutionPlan: normalizeSubstitutionPlan({ ...team, substitutionPlan: plan }),
  };
}

export function autoPickSubstitutionPlan(team: Team, formation: Formation): Team {
  return applySubstitutionPlanToTeam(team, buildDefaultSubstitutionPlan(team, formation));
}

export function clearSubstitutionPlan(team: Team): Team {
  return { ...team, substitutionPlan: [] };
}

export function addSubstitutionToTeam(team: Team, instruction: SubstitutionInstruction): Team {
  const current = normalizeSubstitutionPlan(team).filter(
    (item) => item.outPlayerId !== instruction.outPlayerId && item.inPlayerId !== instruction.inPlayerId,
  );
  return applySubstitutionPlanToTeam(team, [...current, instruction].slice(0, MAX_SUBSTITUTIONS));
}

function getAverage(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function buildPlanIssues(team: Team, formation: Formation, plan: SubstitutionInstruction[]): SubstitutionValidationIssue[] {
  const selectedIds = getSelectedLineupPlayerIds(team, formation);
  const selectedIdSet = new Set(selectedIds);
  const playerById = new Map(team.players.map((player) => [player.id, player]));
  const issues: SubstitutionValidationIssue[] = [];
  const usedOut = new Set<string>();
  const usedIn = new Set<string>();

  for (const item of plan) {
    const outPlayer = playerById.get(item.outPlayerId);
    const inPlayer = playerById.get(item.inPlayerId);

    if (!outPlayer || !inPlayer) {
      issues.push({ severity: "danger", message: "Planul contine un jucator care nu mai exista in lot." });
      continue;
    }
    if (!selectedIdSet.has(outPlayer.id)) {
      issues.push({ severity: "danger", message: `${outPlayer.name} nu este titular, deci nu poate fi scos.` });
    }
    if (selectedIdSet.has(inPlayer.id)) {
      issues.push({ severity: "danger", message: `${inPlayer.name} este deja titular, deci nu poate intra de pe banca.` });
    }
    if (usedOut.has(outPlayer.id) || usedIn.has(inPlayer.id)) {
      issues.push({ severity: "danger", message: "Acelasi jucator apare in mai multe schimbari." });
    }
    if (outPlayer.position !== inPlayer.position) {
      issues.push({ severity: "warning", message: `${inPlayer.name} intra pe alt post decat ${outPlayer.name}.` });
    }
    if (item.minute < 45) {
      issues.push({ severity: "warning", message: `Schimbare foarte devreme in minutul ${item.minute}.` });
    }

    usedOut.add(outPlayer.id);
    usedIn.add(inPlayer.id);
  }

  if (plan.length === 0) {
    issues.push({ severity: "warning", message: "Nu ai planificat nicio schimbare pentru urmatorul meci." });
  }
  if (issues.length === 0) {
    issues.push({ severity: "ok", message: "Planul de schimbari este pregatit pentru urmatorul meci." });
  }

  return issues;
}

export function buildSubstitutionReport(team: Team, formation: Formation): SubstitutionReport {
  const selectedIds = getSelectedLineupPlayerIds(team, formation);
  const selectedIdSet = new Set(selectedIds);
  const starters = team.players.filter((player) => selectedIdSet.has(player.id));
  const bench = team.players.filter((player) => !selectedIdSet.has(player.id));
  const planned = normalizeSubstitutionPlan(team);
  const recommendations = getSubstitutionRecommendations(team, formation);
  const issues = buildPlanIssues(team, formation, planned);
  const plannedRecommendationImpact = planned.map((item) => {
    const outPlayer = team.players.find((player) => player.id === item.outPlayerId);
    const inPlayer = team.players.find((player) => player.id === item.inPlayerId);
    return outPlayer && inPlayer ? getSubstitutionImpact(outPlayer, inPlayer) : 0;
  });
  const expectedImpact = Math.round(getAverage(plannedRecommendationImpact));
  const benchStrength = Math.round(getAverage(bench.map(getPlayerScore)) / 1.9);
  const isValid = planned.length > 0 && !issues.some((issue) => issue.severity === "danger");

  return {
    planned,
    recommendations,
    starters,
    bench,
    isValid,
    benchStrength,
    expectedImpact,
    issues,
    summary: isValid
      ? `${planned.length}/3 schimbari pregatite. Impact estimat ${expectedImpact >= 0 ? "+" : ""}${expectedImpact}.`
      : "Planul de schimbari are nevoie de atentie inainte de meci.",
  };
}

export function applySubstitutionToActiveIds(
  activePlayerIds: string[],
  instruction: SubstitutionInstruction,
): string[] {
  return activePlayerIds.map((playerId) =>
    playerId === instruction.outPlayerId ? instruction.inPlayerId : playerId,
  );
}

export function getSubstitutionPlayerNames(team: Team, instruction: SubstitutionInstruction): { outName: string; inName: string } {
  const outName = team.players.find((player) => player.id === instruction.outPlayerId)?.name ?? "Unknown";
  const inName = team.players.find((player) => player.id === instruction.inPlayerId)?.name ?? "Unknown";
  return { outName, inName };
}
