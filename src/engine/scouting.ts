import type { ClubFinance } from "./finance";
import { clamp } from "./random";
import { estimatePlayerValue, type TransferMarketPlayer } from "./transferMarket";
import type { Player, Position, Tactic, Team } from "./types";

export type ScoutRecommendation = "must_sign" | "good_option" | "squad_depth" | "avoid";
export type ScoutRiskLevel = "low" | "medium" | "high";
export type SquadNeedLevel = "urgent" | "useful" | "covered";

export interface ScoutReport {
  id: string;
  targetPlayerId: string;
  playerName: string;
  position: Position;
  age: number;
  overall: number;
  value: number;
  wage: number;
  seasonNumber: number;
  round: number;
  scoutCost: number;
  tacticalFit: number;
  financialFit: number;
  potentialEstimate: number;
  squadNeed: SquadNeedLevel;
  readiness: number;
  riskLevel: ScoutRiskLevel;
  recommendation: ScoutRecommendation;
  strengths: string[];
  concerns: string[];
  summary: string;
}

export type ScoutingRecord = ScoutReport;

const minimumByPosition: Record<Position, number> = {
  GK: 1,
  DEF: 4,
  MID: 4,
  ATT: 2,
};

function countByPosition(team: Team, position: Position): number {
  return team.players.filter((player) => player.position === position).length;
}

function getPositionAverage(team: Team, position: Position): number {
  const players = team.players.filter((player) => player.position === position);
  if (players.length === 0) return 0;
  return Math.round(players.reduce((sum, player) => sum + player.overall, 0) / players.length);
}

export function getScoutingCost(player: Player): number {
  const value = estimatePlayerValue(player);
  const raw = 90 + player.overall * 3.2 + value * 0.035;
  return Math.max(225, Math.round(raw / 25) * 25);
}

export function getSquadNeed(team: Team, position: Position): SquadNeedLevel {
  const count = countByPosition(team, position);
  const minimum = minimumByPosition[position];

  if (count <= minimum) return "urgent";
  if (position === "GK") return count <= 2 ? "useful" : "covered";
  if (count <= minimum + 1) return "useful";

  const average = getPositionAverage(team, position);
  if (average < 68) return "useful";

  return "covered";
}

function getTacticalFit(player: Player, tactic: Tactic): number {
  let score = player.overall;

  if (player.position === "ATT") {
    score += player.shooting * 0.16 + player.pace * 0.08;
    if (tactic.mentality === "attacking") score += 8;
    if (tactic.formation === "4-3-3") score += 5;
  }

  if (player.position === "MID") {
    score += player.passing * 0.18 + player.stamina * 0.08;
    if (tactic.formation === "4-2-3-1") score += 6;
    if (tactic.pressing === "high") score += player.stamina >= 72 ? 5 : -3;
  }

  if (player.position === "DEF") {
    score += player.defending * 0.18 + player.stamina * 0.06;
    if (tactic.mentality === "defensive") score += 7;
    if (tactic.formation === "5-3-2") score += 5;
  }

  if (player.position === "GK") {
    score += player.defending * 0.2;
    if (tactic.mentality === "defensive") score += 4;
  }

  if (tactic.pressing === "high" && player.stamina < 65) score -= 8;
  if (tactic.mentality === "attacking" && player.pace < 62 && player.position !== "GK") score -= 4;

  return clamp(Math.round(score / 1.16), 1, 100);
}

function getFinancialFit(player: TransferMarketPlayer, transferBudget: number, finance: ClubFinance): number {
  const valueFit = player.value <= transferBudget ? 100 : Math.max(12, Math.round((transferBudget / player.value) * 100));
  const cashFit = player.value <= finance.cashBalance ? 100 : Math.max(10, Math.round((finance.cashBalance / player.value) * 100));
  const wageFit = player.wage <= finance.wageBudget * 0.16 ? 100 : Math.max(8, Math.round((finance.wageBudget * 0.16 / player.wage) * 100));

  return clamp(Math.round(valueFit * 0.45 + cashFit * 0.2 + wageFit * 0.35), 1, 100);
}

function getPotentialEstimate(player: Player): number {
  const ageBonus = player.age <= 20 ? 11 : player.age <= 23 ? 7 : player.age <= 27 ? 3 : player.age <= 30 ? 1 : -3;
  return clamp(player.overall + ageBonus, player.overall, 92);
}

function getReadiness(player: Player, squadNeed: SquadNeedLevel): number {
  const needBonus = squadNeed === "urgent" ? 10 : squadNeed === "useful" ? 5 : 0;
  const experienceBonus = player.age >= 25 && player.age <= 31 ? 4 : player.age >= 32 ? 1 : -2;
  return clamp(player.overall + needBonus + experienceBonus, 1, 100);
}

function getRiskLevel(player: TransferMarketPlayer, financialFit: number): ScoutRiskLevel {
  if (player.age >= 33 || financialFit < 45 || player.fitness && player.fitness < 70) return "high";
  if (player.age >= 30 || financialFit < 68 || player.wage > 70) return "medium";
  return "low";
}

function getRecommendation(score: number, riskLevel: ScoutRiskLevel, squadNeed: SquadNeedLevel): ScoutRecommendation {
  if (riskLevel === "high" && score < 82) return "avoid";
  if (score >= 86 && riskLevel !== "high") return "must_sign";
  if (score >= 74 || (squadNeed === "urgent" && score >= 68)) return "good_option";
  if (score >= 62) return "squad_depth";
  return "avoid";
}

function buildStrengths(player: TransferMarketPlayer, tacticalFit: number, financialFit: number, squadNeed: SquadNeedLevel): string[] {
  const strengths: string[] = [];

  if (squadNeed === "urgent") strengths.push(`Acopera o nevoie urgenta pe ${player.position}.`);
  if (tacticalFit >= 82) strengths.push("Se potriveste foarte bine cu tactica actuala.");
  if (financialFit >= 82) strengths.push("Costul este sanatos pentru bugetul actual.");
  if (player.age <= 23) strengths.push("Are varsta buna pentru dezvoltare si revanzare.");
  if (player.overall >= 74) strengths.push("Poate intra rapid in primul 11.");
  if (player.stamina >= 76) strengths.push("Rezista bine la ritm si pressing.");

  return strengths.slice(0, 4);
}

function buildConcerns(player: TransferMarketPlayer, financialFit: number, squadNeed: SquadNeedLevel, riskLevel: ScoutRiskLevel): string[] {
  const concerns: string[] = [];

  if (financialFit < 60) concerns.push("Transferul poate tensiona bugetul clubului.");
  if (squadNeed === "covered") concerns.push(`Postul ${player.position} este deja destul de acoperit.`);
  if (player.age >= 32) concerns.push("Varsta reduce potentialul de crestere si revanzare.");
  if (player.stamina < 62) concerns.push("Stamina poate deveni o problema in meciurile cu pressing.");
  if (riskLevel === "high") concerns.push("Profilul este considerat risc ridicat de staff.");

  return concerns.slice(0, 4);
}

export function buildScoutReport(input: {
  player: TransferMarketPlayer;
  team: Team;
  tactic: Tactic;
  transferBudget: number;
  finance: ClubFinance;
  seasonNumber: number;
  round: number;
}): ScoutReport {
  const squadNeed = getSquadNeed(input.team, input.player.position);
  const tacticalFit = getTacticalFit(input.player, input.tactic);
  const financialFit = getFinancialFit(input.player, input.transferBudget, input.finance);
  const potentialEstimate = getPotentialEstimate(input.player);
  const readiness = getReadiness(input.player, squadNeed);
  const riskLevel = getRiskLevel(input.player, financialFit);
  const weightedScore = Math.round(tacticalFit * 0.38 + financialFit * 0.28 + readiness * 0.22 + potentialEstimate * 0.12);
  const recommendation = getRecommendation(weightedScore, riskLevel, squadNeed);
  const scoutCost = getScoutingCost(input.player);
  const strengths = buildStrengths(input.player, tacticalFit, financialFit, squadNeed);
  const concerns = buildConcerns(input.player, financialFit, squadNeed, riskLevel);

  return {
    id: `scout-${input.seasonNumber}-${input.round}-${input.player.id}`,
    targetPlayerId: input.player.id,
    playerName: input.player.name,
    position: input.player.position,
    age: input.player.age,
    overall: input.player.overall,
    value: input.player.value,
    wage: input.player.wage,
    seasonNumber: input.seasonNumber,
    round: input.round,
    scoutCost,
    tacticalFit,
    financialFit,
    potentialEstimate,
    squadNeed,
    readiness,
    riskLevel,
    recommendation,
    strengths,
    concerns,
    summary: `${input.player.name}: ${getRecommendationLabel(recommendation)}. Fit tactic ${tacticalFit}/100, fit financiar ${financialFit}/100, risc ${getRiskLabel(riskLevel)}.`,
  };
}

export function getRecommendationLabel(recommendation: ScoutRecommendation): string {
  if (recommendation === "must_sign") return "Must sign";
  if (recommendation === "good_option") return "Good option";
  if (recommendation === "squad_depth") return "Squad depth";
  return "Avoid";
}

export function getRiskLabel(riskLevel: ScoutRiskLevel): string {
  if (riskLevel === "low") return "scazut";
  if (riskLevel === "medium") return "mediu";
  return "ridicat";
}

export function getSquadNeedLabel(need: SquadNeedLevel): string {
  if (need === "urgent") return "Urgent";
  if (need === "useful") return "Util";
  return "Acoperit";
}

export function upsertScoutReport(reports: ScoutReport[], report: ScoutReport): ScoutReport[] {
  return [report, ...reports.filter((item) => item.targetPlayerId !== report.targetPlayerId)].slice(0, 24);
}

export function getScoutReportForPlayer(reports: ScoutReport[], playerId: string): ScoutReport | undefined {
  return reports.find((report) => report.targetPlayerId === playerId);
}

export function getTopScoutRecommendations(reports: ScoutReport[], limit = 5): ScoutReport[] {
  const priority: Record<ScoutRecommendation, number> = {
    must_sign: 4,
    good_option: 3,
    squad_depth: 2,
    avoid: 1,
  };

  return [...reports]
    .sort((a, b) => {
      const recommendationDiff = priority[b.recommendation] - priority[a.recommendation];
      if (recommendationDiff !== 0) return recommendationDiff;
      const fitDiff = b.tacticalFit + b.financialFit - (a.tacticalFit + a.financialFit);
      if (fitDiff !== 0) return fitDiff;
      return b.overall - a.overall;
    })
    .slice(0, limit);
}
