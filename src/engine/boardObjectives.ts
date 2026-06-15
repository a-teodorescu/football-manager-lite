import type { CupState } from "./cupCompetition";
import { calculateSquadWageBill, type ClubFinance } from "./finance";
import { USER_TEAM_ID } from "./leagueSimulation";
import { clamp } from "./random";
import type { StandingRow } from "./standings";
import type { Team } from "./types";

export type BoardObjectiveType =
  | "league_position"
  | "wage_control"
  | "cash_balance"
  | "cup_run"
  | "academy_level";

export type BoardObjectiveStatus = "pending" | "on_track" | "warning" | "failed" | "completed";
export type JobStatus = "secure" | "stable" | "under_pressure" | "danger" | "sacked";
export type BoardMood = "delighted" | "satisfied" | "neutral" | "concerned" | "furious";

export interface BoardObjective {
  id: string;
  seasonNumber: number;
  type: BoardObjectiveType;
  title: string;
  description: string;
  target: number;
  weight: number;
  status: BoardObjectiveStatus;
  progress: number;
  score: number;
  summary: string;
}

export interface BoardReviewRecord {
  id: string;
  seasonNumber: number;
  round: number;
  confidenceScore: number;
  jobSecurity: number;
  jobStatus: JobStatus;
  mood: BoardMood;
  sackRiskPercent: number;
  summary: string;
  warnings: string[];
  objectiveSnapshots: BoardObjective[];
}

export interface BoardState {
  seasonNumber: number;
  managerReputation: number;
  jobSecurity: number;
  jobStatus: JobStatus;
  mood: BoardMood;
  sackRiskPercent: number;
  objectives: BoardObjective[];
  reviews: BoardReviewRecord[];
  sacked: boolean;
  lastReviewRoundKey?: string;
}

export interface BoardEvaluationInput {
  board: BoardState;
  team: Team;
  standings: StandingRow[];
  finance: ClubFinance;
  transferBudget: number;
  academyLevel: number;
  cupState: CupState;
  seasonNumber: number;
  currentRound: number;
  maxRound: number;
  seasonFinished: boolean;
  forceReview?: boolean;
}

export interface BoardEvaluationResult {
  board: BoardState;
  review: BoardReviewRecord;
}

function getLeagueTargetPosition(seasonNumber: number): number {
  if (seasonNumber <= 1) return 4;
  if (seasonNumber === 2) return 3;
  return 2;
}

function getCashTarget(seasonNumber: number): number {
  return 11000 + Math.max(0, seasonNumber - 1) * 1600;
}

function getAcademyTarget(seasonNumber: number): number {
  if (seasonNumber <= 1) return 2;
  if (seasonNumber <= 3) return 3;
  return 4;
}

function createObjective(input: {
  seasonNumber: number;
  type: BoardObjectiveType;
  title: string;
  description: string;
  target: number;
  weight: number;
}): BoardObjective {
  return {
    id: `board-s${input.seasonNumber}-${input.type}`,
    seasonNumber: input.seasonNumber,
    type: input.type,
    title: input.title,
    description: input.description,
    target: input.target,
    weight: input.weight,
    status: "pending",
    progress: 0,
    score: 50,
    summary: "Obiectivul va fi evaluat pe parcursul sezonului.",
  };
}

export function createSeasonBoardObjectives(seasonNumber: number): BoardObjective[] {
  return [
    createObjective({
      seasonNumber,
      type: "league_position",
      title: "Pozitie in campionat",
      description: `Termina sezonul pe locul ${getLeagueTargetPosition(seasonNumber)} sau mai sus.`,
      target: getLeagueTargetPosition(seasonNumber),
      weight: 36,
    }),
    createObjective({
      seasonNumber,
      type: "wage_control",
      title: "Control salarial",
      description: "Pastreaza wage bill-ul sub bugetul salarial aprobat.",
      target: 100,
      weight: 20,
    }),
    createObjective({
      seasonNumber,
      type: "cash_balance",
      title: "Stabilitate cash",
      description: `Pastreaza cash balance peste €${getCashTarget(seasonNumber).toLocaleString("en-US")}k.`,
      target: getCashTarget(seasonNumber),
      weight: 18,
    }),
    createObjective({
      seasonNumber,
      type: "cup_run",
      title: "Parcurs cupa",
      description: "Ajunge cel putin in semifinala cupei.",
      target: 2,
      weight: 14,
    }),
    createObjective({
      seasonNumber,
      type: "academy_level",
      title: "Dezvoltare academie",
      description: `Ajunge cu academia la nivelul ${getAcademyTarget(seasonNumber)}.`,
      target: getAcademyTarget(seasonNumber),
      weight: 12,
    }),
  ];
}

export function createInitialBoardState(seasonNumber = 1, managerReputation = 50): BoardState {
  return {
    seasonNumber,
    managerReputation,
    jobSecurity: 72,
    jobStatus: "stable",
    mood: "neutral",
    sackRiskPercent: 18,
    objectives: createSeasonBoardObjectives(seasonNumber),
    reviews: [],
    sacked: false,
  };
}

function getUserStanding(standings: StandingRow[]): { row: StandingRow; position: number } {
  const positionIndex = standings.findIndex((row) => row.teamId === USER_TEAM_ID);
  const fallback = standings[standings.length - 1];

  return {
    row: positionIndex >= 0 ? standings[positionIndex] : fallback,
    position: Math.max(1, positionIndex + 1 || standings.length),
  };
}

function getCupProgressStage(cupState: CupState): number {
  if (cupState.championTeamId === USER_TEAM_ID) return 4;

  const userMatches = cupState.matches.filter(
    (match) => match.homeTeamId === USER_TEAM_ID || match.awayTeamId === USER_TEAM_ID || match.winnerTeamId === USER_TEAM_ID
  );

  if (userMatches.some((match) => match.roundName === "final")) return 3;
  if (userMatches.some((match) => match.roundName === "semi_final")) return 2;
  if (userMatches.some((match) => match.roundName === "quarter_final")) return 1;
  return 0;
}

function isUserEliminatedFromCup(cupState: CupState): boolean {
  if (cupState.championTeamId) return cupState.championTeamId !== USER_TEAM_ID;

  return !cupState.matches.some((match) => {
    if (!match.played) return match.homeTeamId === USER_TEAM_ID || match.awayTeamId === USER_TEAM_ID;
    return match.winnerTeamId === USER_TEAM_ID;
  });
}

function getStatusFromScore(score: number, terminal = false): BoardObjectiveStatus {
  if (score >= 100) return "completed";
  if (score >= 72) return "on_track";
  if (score >= 45) return terminal ? "failed" : "warning";
  return "failed";
}

function evaluateObjective(objective: BoardObjective, input: BoardEvaluationInput): BoardObjective {
  const userStanding = getUserStanding(input.standings);
  const wageBill = calculateSquadWageBill(input.team);
  const wageRatio = wageBill / Math.max(1, input.finance.wageBudget);
  const terminal = input.seasonFinished || input.board.sacked;

  if (objective.type === "league_position") {
    const pointsPerMatch = userStanding.row.played > 0 ? userStanding.row.points / userStanding.row.played : 1.35;
    const goalModifier = clamp(50 + userStanding.row.goalDifference * 6, 20, 100);
    const positionScore = clamp(Math.round(((input.standings.length + 1 - userStanding.position) / input.standings.length) * 100), 10, 100);
    const targetBonus = userStanding.position <= objective.target ? 24 : -(userStanding.position - objective.target) * 13;
    const score = clamp(Math.round(positionScore * 0.55 + (pointsPerMatch / 2.05) * 32 + goalModifier * 0.13 + targetBonus), 1, 115);

    return {
      ...objective,
      progress: userStanding.position,
      score,
      status: userStanding.position <= objective.target && terminal ? "completed" : getStatusFromScore(score, terminal),
      summary: `Loc ${userStanding.position}/${input.standings.length}, tinta loc ${objective.target}, ${userStanding.row.points} puncte.`,
    };
  }

  if (objective.type === "wage_control") {
    const score = clamp(Math.round(128 - wageRatio * 72), 1, 110);

    return {
      ...objective,
      progress: Math.round(wageRatio * 100),
      score,
      status: wageRatio <= 1 && terminal ? "completed" : getStatusFromScore(score, terminal),
      summary: `Wage bill €${wageBill.toLocaleString("en-US")}k / buget €${input.finance.wageBudget.toLocaleString("en-US")}k (${Math.round(wageRatio * 100)}%).`,
    };
  }

  if (objective.type === "cash_balance") {
    const score = clamp(Math.round((input.finance.cashBalance / Math.max(1, objective.target)) * 92), 1, 112);

    return {
      ...objective,
      progress: input.finance.cashBalance,
      score,
      status: input.finance.cashBalance >= objective.target && terminal ? "completed" : getStatusFromScore(score, terminal),
      summary: `Cash €${input.finance.cashBalance.toLocaleString("en-US")}k / tinta €${objective.target.toLocaleString("en-US")}k.`,
    };
  }

  if (objective.type === "cup_run") {
    const cupProgress = getCupProgressStage(input.cupState);
    const userEliminated = isUserEliminatedFromCup(input.cupState);
    const score = cupProgress >= objective.target ? 100 : userEliminated ? 35 + cupProgress * 12 : 58 + cupProgress * 18;

    return {
      ...objective,
      progress: cupProgress,
      score,
      status: cupProgress >= objective.target ? "completed" : userEliminated || terminal ? "failed" : getStatusFromScore(score),
      summary: cupProgress >= objective.target
        ? "Obiectiv cupa atins: clubul a ajuns cel putin in semifinale."
        : userEliminated
          ? "Clubul a fost eliminat inainte de semifinale."
          : "Obiectiv in curs: mai trebuie cel putin semifinala.",
    };
  }

  const score = clamp(Math.round((input.academyLevel / Math.max(1, objective.target)) * 100), 1, 110);

  return {
    ...objective,
    progress: input.academyLevel,
    score,
    status: input.academyLevel >= objective.target && terminal ? "completed" : getStatusFromScore(score, terminal),
    summary: `Academie nivel ${input.academyLevel} / tinta nivel ${objective.target}.`,
  };
}

function getWeightedConfidence(objectives: BoardObjective[]): number {
  const totalWeight = objectives.reduce((sum, objective) => sum + objective.weight, 0);
  const weightedScore = objectives.reduce((sum, objective) => sum + objective.score * objective.weight, 0);
  return clamp(Math.round(weightedScore / Math.max(1, totalWeight)), 1, 100);
}

function getMood(confidenceScore: number): BoardMood {
  if (confidenceScore >= 84) return "delighted";
  if (confidenceScore >= 68) return "satisfied";
  if (confidenceScore >= 52) return "neutral";
  if (confidenceScore >= 36) return "concerned";
  return "furious";
}

export function getBoardMoodLabel(mood: BoardMood): string {
  if (mood === "delighted") return "Incantat";
  if (mood === "satisfied") return "Multumit";
  if (mood === "neutral") return "Neutru";
  if (mood === "concerned") return "Ingrijorat";
  return "Furios";
}

function getJobStatus(jobSecurity: number, sacked: boolean): JobStatus {
  if (sacked) return "sacked";
  if (jobSecurity >= 78) return "secure";
  if (jobSecurity >= 58) return "stable";
  if (jobSecurity >= 36) return "under_pressure";
  return "danger";
}

export function getJobStatusLabel(status: JobStatus): string {
  if (status === "secure") return "Foarte sigur";
  if (status === "stable") return "Stabil";
  if (status === "under_pressure") return "Sub presiune";
  if (status === "danger") return "Pericol";
  return "Demitere";
}

export function getObjectiveStatusLabel(status: BoardObjectiveStatus): string {
  if (status === "completed") return "Atins";
  if (status === "on_track") return "On track";
  if (status === "warning") return "Atentie";
  if (status === "failed") return "Ratat";
  return "In asteptare";
}

function getWarnings(objectives: BoardObjective[], jobSecurity: number): string[] {
  const warnings: string[] = [];

  objectives
    .filter((objective) => objective.status === "failed" || objective.status === "warning")
    .slice(0, 3)
    .forEach((objective) => warnings.push(`${objective.title}: ${objective.summary}`));

  if (jobSecurity < 40) warnings.unshift("Job security este foarte jos. Board-ul poate cere rezultate rapid.");
  if (warnings.length === 0) warnings.push("Board-ul nu are avertizari majore in acest moment.");

  return warnings.slice(0, 4);
}

function getReviewSummary(input: { mood: BoardMood; jobStatus: JobStatus; confidenceScore: number; sacked: boolean }): string {
  if (input.sacked) return "Board-ul a decis demiterea managerului dupa nerespectarea obiectivelor critice.";
  if (input.mood === "delighted") return `Board-ul este incantat. Confidence ${input.confidenceScore}/100, job status ${getJobStatusLabel(input.jobStatus)}.`;
  if (input.mood === "satisfied") return `Board-ul este multumit. Confidence ${input.confidenceScore}/100, dar obiectivele raman monitorizate.`;
  if (input.mood === "neutral") return `Board-ul ramane neutru. Confidence ${input.confidenceScore}/100, rezultatele trebuie mentinute.`;
  if (input.mood === "concerned") return `Board-ul este ingrijorat. Confidence ${input.confidenceScore}/100, ai nevoie de progres rapid.`;
  return `Board-ul este furios. Confidence ${input.confidenceScore}/100, jobul este in pericol.`;
}

export function evaluateBoard(input: BoardEvaluationInput): BoardEvaluationResult {
  const baseBoard = input.board.seasonNumber === input.seasonNumber
    ? input.board
    : createInitialBoardState(input.seasonNumber, input.board.managerReputation);

  const objectives = baseBoard.objectives.map((objective) => evaluateObjective(objective, input));
  const confidenceScore = getWeightedConfidence(objectives);
  const momentumDelta = Math.round((confidenceScore - 58) * 0.28);
  const failedWeight = objectives
    .filter((objective) => objective.status === "failed")
    .reduce((sum, objective) => sum + objective.weight, 0);
  const crisisPenalty = failedWeight >= 50 ? 16 : failedWeight >= 30 ? 9 : 0;
  const jobSecurity = clamp(Math.round(baseBoard.jobSecurity * 0.72 + confidenceScore * 0.28 + momentumDelta - crisisPenalty), 1, 100);
  const sacked = baseBoard.sacked || (input.seasonFinished && jobSecurity <= 18 && failedWeight >= 50);
  const jobStatus = getJobStatus(jobSecurity, sacked);
  const mood = getMood(confidenceScore);
  const sackRiskPercent = sacked ? 100 : clamp(Math.round(100 - jobSecurity + failedWeight * 0.42), 0, 99);
  const reviewRound = input.seasonFinished ? input.maxRound : Math.max(1, input.currentRound - 1);
  const roundKey = `s${input.seasonNumber}:r${reviewRound}:confidence-${confidenceScore}`;
  const warnings = getWarnings(objectives, jobSecurity);
  const managerReputation = clamp(
    Math.round(baseBoard.managerReputation * 0.82 + confidenceScore * 0.18 + (sacked ? -10 : 0)),
    1,
    100
  );
  const review: BoardReviewRecord = {
    id: `board-review-s${input.seasonNumber}-r${reviewRound}-${confidenceScore}-${jobSecurity}`,
    seasonNumber: input.seasonNumber,
    round: reviewRound,
    confidenceScore,
    jobSecurity,
    jobStatus,
    mood,
    sackRiskPercent,
    summary: getReviewSummary({ mood, jobStatus, confidenceScore, sacked }),
    warnings,
    objectiveSnapshots: objectives,
  };
  const shouldAddReview = input.forceReview || baseBoard.lastReviewRoundKey !== roundKey;
  const reviews = shouldAddReview
    ? [review, ...baseBoard.reviews.filter((item) => item.id !== review.id)].slice(0, 24)
    : baseBoard.reviews;

  return {
    board: {
      ...baseBoard,
      seasonNumber: input.seasonNumber,
      managerReputation,
      jobSecurity,
      jobStatus,
      mood,
      sackRiskPercent,
      objectives,
      reviews,
      sacked,
      lastReviewRoundKey: roundKey,
    },
    review,
  };
}
