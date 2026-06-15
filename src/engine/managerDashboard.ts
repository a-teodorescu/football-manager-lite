import { calculateSquadWageBill, getWageBudgetStatus, type ClubFinance } from "./finance";
import { getAverageFitness, getUnavailablePlayers, isPlayerInjured } from "./playerStatus";
import { clamp } from "./random";
import type { StandingRow } from "./standings";
import { calculateTeamStrength } from "./teamStrength";
import { estimatePlayerValue } from "./transferMarket";
import type { Player, Tactic, Team } from "./types";

export type DashboardStatus = "on_track" | "watch" | "at_risk";
export type DashboardAlertSeverity = "info" | "warning" | "danger";
export type BoardConfidenceLevel = "excellent" | "stable" | "concern" | "crisis";

export interface DashboardObjective {
  id: string;
  title: string;
  status: DashboardStatus;
  score: number;
  detail: string;
}

export interface DashboardAlert {
  id: string;
  severity: DashboardAlertSeverity;
  title: string;
  message: string;
  targetTab: string;
}

export interface DashboardKeyPlayer {
  id: string;
  name: string;
  position: string;
  overall: number;
  value: number;
  note: string;
}

export interface ManagerDashboard {
  rating: number;
  boardConfidenceLabel: string;
  boardConfidenceLevel: BoardConfidenceLevel;
  headline: string;
  seasonProgressPercent: number;
  objectives: DashboardObjective[];
  alerts: DashboardAlert[];
  keyPlayers: DashboardKeyPlayer[];
  nextActions: string[];
}

export interface BuildManagerDashboardInput {
  team: Team;
  tactic: Tactic;
  standings: StandingRow[];
  finance: ClubFinance;
  transferBudget: number;
  academyLevel: number;
  currentRound: number;
  maxRound: number;
  seasonFinished: boolean;
}

function getObjectiveStatus(score: number): DashboardStatus {
  if (score >= 72) return "on_track";
  if (score >= 48) return "watch";
  return "at_risk";
}

function getBoardConfidenceLevel(rating: number): BoardConfidenceLevel {
  if (rating >= 82) return "excellent";
  if (rating >= 62) return "stable";
  if (rating >= 42) return "concern";
  return "crisis";
}

function getBoardConfidenceLabel(level: BoardConfidenceLevel): string {
  if (level === "excellent") return "Excellent";
  if (level === "stable") return "Stable";
  if (level === "concern") return "Sub observatie";
  return "Critic";
}

function getPerformanceScore(team: Team, standings: StandingRow[]): number {
  const userIndex = standings.findIndex((row) => row.teamId === team.id);
  const userStanding = userIndex >= 0 ? standings[userIndex] : standings[0];
  const leagueSize = Math.max(1, standings.length);
  const positionScore = Math.round(((leagueSize - Math.max(0, userIndex)) / leagueSize) * 100);
  const pointsPerMatch = userStanding?.played ? userStanding.points / userStanding.played : 1.25;
  const ppmScore = clamp(Math.round((pointsPerMatch / 2.15) * 100), 18, 100);
  const goalScore = clamp(58 + (userStanding?.goalDifference ?? 0) * 4, 18, 100);

  return Math.round(positionScore * 0.42 + ppmScore * 0.4 + goalScore * 0.18);
}

function getSquadScore(team: Team, tactic: Tactic): number {
  const strength = calculateTeamStrength(team, tactic);
  const averageFitness = getAverageFitness(team);
  const unavailablePenalty = getUnavailablePlayers(team).length * 5;
  const moraleBonus = (team.morale - 60) * 0.35;

  return clamp(Math.round(strength.overall * 0.92 + averageFitness * 0.18 + moraleBonus - unavailablePenalty), 1, 100);
}

function getFinanceScore(team: Team, finance: ClubFinance, transferBudget: number): number {
  const wageBill = calculateSquadWageBill(team);
  const wagePressure = wageBill / Math.max(1, finance.wageBudget);
  const wageScore = clamp(Math.round(110 - wagePressure * 60), 10, 100);
  const cashScore = clamp(Math.round(finance.cashBalance / 850), 10, 100);
  const transferScore = clamp(Math.round(transferBudget / 180), 10, 100);

  return Math.round(wageScore * 0.48 + cashScore * 0.34 + transferScore * 0.18);
}

function getDevelopmentScore(team: Team, academyLevel: number): number {
  const youngPlayers = team.players.filter((player) => player.age <= 23).length;
  const primePlayers = team.players.filter((player) => player.age >= 24 && player.age <= 30).length;
  const ageBalanceScore = clamp(youngPlayers * 9 + primePlayers * 4, 20, 100);
  const academyScore = clamp(academyLevel * 18, 18, 100);

  return Math.round(ageBalanceScore * 0.48 + academyScore * 0.52);
}

function getPlayerNote(player: Player): string {
  if (isPlayerInjured(player)) return `Accidentat: ${player.injury?.label}`;
  if ((player.fitness ?? 100) < 60) return `Obosit, fitness ${player.fitness ?? 100}`;
  if (player.age <= 21) return "Prospect important";
  if (player.age >= 32) return "Veteran cheie";
  return "Titular de baza";
}

function buildAlerts(input: BuildManagerDashboardInput): DashboardAlert[] {
  const { team, finance, transferBudget, seasonFinished } = input;
  const alerts: DashboardAlert[] = [];
  const injuredCount = team.players.filter(isPlayerInjured).length;
  const tiredCount = team.players.filter((player) => !isPlayerInjured(player) && (player.fitness ?? 100) < 55).length;
  const wageStatus = getWageBudgetStatus(finance, team);

  if (injuredCount > 0) {
    alerts.push({
      id: "injuries",
      severity: injuredCount >= 3 ? "danger" : "warning",
      title: "Probleme medicale",
      message: `${injuredCount} jucator${injuredCount === 1 ? "" : "i"} accidentat${injuredCount === 1 ? "" : "i"}. Verifica raportul Fitness inainte de urmatorul meci.`,
      targetTab: "medical",
    });
  }

  if (tiredCount >= 3) {
    alerts.push({
      id: "fitness",
      severity: tiredCount >= 5 ? "danger" : "warning",
      title: "Lot obosit",
      message: `${tiredCount} jucatori au fitness sub 55. Antrenamentul Fitness poate reduce riscul de accidentare.`,
      targetTab: "training",
    });
  }

  if (wageStatus === "over") {
    alerts.push({
      id: "wages",
      severity: "danger",
      title: "Buget salarial depasit",
      message: "Salariile depasesc bugetul si genereaza penalizare financiara dupa fiecare etapa.",
      targetTab: "finance",
    });
  } else if (wageStatus === "tight") {
    alerts.push({
      id: "wages-tight",
      severity: "warning",
      title: "Presiune salariala",
      message: "Salariile sunt aproape de limita. Urmatorul transfer trebuie gandit atent.",
      targetTab: "finance",
    });
  }

  if (finance.cashBalance < 7000) {
    alerts.push({
      id: "cash",
      severity: finance.cashBalance < 2500 ? "danger" : "warning",
      title: "Cash redus",
      message: "Balanta cash este joasa. Evita scouting/upgrade-uri pana stabilizezi veniturile.",
      targetTab: "finance",
    });
  }

  if (transferBudget < 1200) {
    alerts.push({
      id: "transfer-budget",
      severity: "info",
      title: "Buget de transfer limitat",
      message: "Piata de free agents ramane utila, dar trebuie sa vinzi sau sa astepti venituri noi.",
      targetTab: "transfers",
    });
  }

  if (seasonFinished) {
    alerts.push({
      id: "season-finished",
      severity: "info",
      title: "Sezon terminat",
      message: "Poti porni sezonul urmator ca sa aplici imbatranirea lotului si prize money.",
      targetTab: "seasons",
    });
  }

  return alerts.slice(0, 5);
}

function buildNextActions(input: BuildManagerDashboardInput, alerts: DashboardAlert[]): string[] {
  const actions: string[] = [];
  const averageFitness = getAverageFitness(input.team);
  const wageStatus = getWageBudgetStatus(input.finance, input.team);

  if (input.seasonFinished) actions.push("Incepe sezonul urmator din tabul Seasons.");
  if (alerts.some((alert) => alert.id === "injuries" || alert.id === "fitness")) actions.push("Verifica Fitness si evita sa fortezi jucatorii cu risc.");
  if (averageFitness < 70) actions.push("Seteaza Training Focus pe Fitness pentru runda curenta.");
  if (wageStatus !== "healthy") actions.push("Verifica Finance si vinde un jucator de rotatie daca salariile apasa bugetul.");
  if (input.transferBudget > 3500 && input.team.players.length < 23) actions.push("Cauta un free agent accesibil pentru rotatie.");
  if (input.academyLevel < 3 && input.finance.cashBalance > 18000) actions.push("Upgrade la Academy pentru prospecte mai bune.");
  if (actions.length === 0) actions.push("Simuleaza urmatoarea etapa si monitorizeaza raportul financiar.");

  return actions.slice(0, 4);
}

export function buildManagerDashboard(input: BuildManagerDashboardInput): ManagerDashboard {
  const performanceScore = getPerformanceScore(input.team, input.standings);
  const squadScore = getSquadScore(input.team, input.tactic);
  const financeScore = getFinanceScore(input.team, input.finance, input.transferBudget);
  const developmentScore = getDevelopmentScore(input.team, input.academyLevel);
  const rating = clamp(
    Math.round(performanceScore * 0.34 + squadScore * 0.28 + financeScore * 0.24 + developmentScore * 0.14),
    1,
    100
  );
  const boardConfidenceLevel = getBoardConfidenceLevel(rating);
  const alerts = buildAlerts(input);
  const keyPlayers = [...input.team.players]
    .sort((a, b) => b.overall - a.overall || estimatePlayerValue(b) - estimatePlayerValue(a))
    .slice(0, 5)
    .map((player) => ({
      id: player.id,
      name: player.name,
      position: player.position,
      overall: player.overall,
      value: estimatePlayerValue(player),
      note: getPlayerNote(player),
    }));

  return {
    rating,
    boardConfidenceLabel: getBoardConfidenceLabel(boardConfidenceLevel),
    boardConfidenceLevel,
    headline:
      boardConfidenceLevel === "excellent"
        ? "Board-ul este incantat de directia clubului."
        : boardConfidenceLevel === "stable"
          ? "Clubul este pe o traiectorie stabila."
          : boardConfidenceLevel === "concern"
            ? "Board-ul cere rezultate si control financiar mai bun."
            : "Situatia este critica: ai nevoie rapid de rezultate si stabilitate.",
    seasonProgressPercent: input.seasonFinished ? 100 : clamp(Math.round(((input.currentRound - 1) / Math.max(1, input.maxRound)) * 100), 0, 100),
    objectives: [
      {
        id: "performance",
        title: "Performanta sportiva",
        status: getObjectiveStatus(performanceScore),
        score: performanceScore,
        detail: "Pozitie in clasament, puncte pe meci si golaveraj.",
      },
      {
        id: "squad",
        title: "Stare lot",
        status: getObjectiveStatus(squadScore),
        score: squadScore,
        detail: "Overall engine, fitness, moral si indisponibili.",
      },
      {
        id: "finance",
        title: "Control financiar",
        status: getObjectiveStatus(financeScore),
        score: financeScore,
        detail: "Cash, wage budget si buget de transfer.",
      },
      {
        id: "development",
        title: "Dezvoltare club",
        status: getObjectiveStatus(developmentScore),
        score: developmentScore,
        detail: "Tineri in lot si nivelul academiei.",
      },
    ],
    alerts,
    keyPlayers,
    nextActions: buildNextActions(input, alerts),
  };
}
