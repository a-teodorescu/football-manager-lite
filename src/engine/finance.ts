import type { FixtureResult } from "./leagueSimulation";
import type { StandingRow } from "./standings";
import type { Player, Team } from "./types";
import { estimatePlayerWage } from "./transferMarket";

export interface ClubFinance {
  cashBalance: number;
  wageBudget: number;
  sponsorBase: number;
}

export interface FinanceReport {
  id: string;
  seasonNumber: number;
  round: number;
  sponsorIncome: number;
  matchdayIncome: number;
  performanceBonus: number;
  wageCost: number;
  overWagePenalty: number;
  academyCost?: number;
  netChange: number;
  balanceAfter: number;
  summary: string;
}

export function createInitialFinance(seasonNumber: number): ClubFinance {
  return {
    cashBalance: 42000 + Math.max(0, seasonNumber - 1) * 4500,
    wageBudget: 980 + Math.max(0, seasonNumber - 1) * 90,
    sponsorBase: 720 + Math.max(0, seasonNumber - 1) * 60,
  };
}

export function getPlayerWage(player: Player): number {
  return player.wage ?? estimatePlayerWage(player);
}

export function calculateSquadWageBill(team: Team): number {
  return team.players.reduce((total, player) => total + getPlayerWage(player), 0);
}

export function getWageBudgetStatus(finance: ClubFinance, team: Team): "healthy" | "tight" | "over" {
  const wageBill = calculateSquadWageBill(team);
  if (wageBill > finance.wageBudget) return "over";
  if (wageBill > finance.wageBudget * 0.9) return "tight";
  return "healthy";
}

function getRoundResultForTeam(roundResults: FixtureResult[], teamId: string): FixtureResult | undefined {
  return roundResults.find((item) => item.result.homeTeamId === teamId || item.result.awayTeamId === teamId);
}

function getOpponentReputation(result: FixtureResult, userTeamId: string): number {
  if (result.fixture.homeTeam.id === userTeamId) return result.fixture.awayTeam.reputation;
  return result.fixture.homeTeam.reputation;
}

function getPerformanceBonus(result: FixtureResult, userTeamId: string): number {
  const userIsHome = result.result.homeTeamId === userTeamId;
  const userScore = userIsHome ? result.result.homeScore : result.result.awayScore;
  const opponentScore = userIsHome ? result.result.awayScore : result.result.homeScore;

  if (userScore > opponentScore) return 360;
  if (userScore === opponentScore) return 160;
  return 70;
}

function getResultLabel(result: FixtureResult, userTeamId: string): string {
  const userIsHome = result.result.homeTeamId === userTeamId;
  const userScore = userIsHome ? result.result.homeScore : result.result.awayScore;
  const opponentScore = userIsHome ? result.result.awayScore : result.result.homeScore;

  if (userScore > opponentScore) return "victorie";
  if (userScore === opponentScore) return "egal";
  return "infrangere";
}

function calculateMatchdayIncome(result: FixtureResult | undefined, userTeam: Team, userPosition: number): number {
  if (!result || result.fixture.homeTeam.id !== userTeam.id) return 0;

  const opponentReputation = getOpponentReputation(result, userTeam.id);
  const positionBoost = Math.max(0, 9 - userPosition) * 32;
  const reputationIncome = userTeam.reputation * 8 + opponentReputation * 5;
  const moraleIncome = Math.round(userTeam.morale * 2.4);

  return Math.round((520 + reputationIncome + moraleIncome + positionBoost) / 10) * 10;
}

export function applyRoundFinances(input: {
  finance: ClubFinance;
  userTeam: Team;
  roundResults: FixtureResult[];
  standings: StandingRow[];
  seasonNumber: number;
  round: number;
  academyCost?: number;
}): { finance: ClubFinance; report: FinanceReport } {
  const { finance, userTeam, roundResults, standings, seasonNumber, round } = input;
  const academyCost = input.academyCost ?? 0;
  const userPosition = Math.max(1, standings.findIndex((row) => row.teamId === userTeam.id) + 1 || standings.length);
  const userResult = getRoundResultForTeam(roundResults, userTeam.id);
  const wageCost = calculateSquadWageBill(userTeam);
  const overWagePenalty = Math.max(0, wageCost - finance.wageBudget) * 2;
  const sponsorIncome = Math.round((finance.sponsorBase + userTeam.reputation * 5 + userTeam.morale * 3 + Math.max(0, 9 - userPosition) * 24) / 10) * 10;
  const matchdayIncome = calculateMatchdayIncome(userResult, userTeam, userPosition);
  const performanceBonus = userResult ? getPerformanceBonus(userResult, userTeam.id) : 0;
  const netChange = sponsorIncome + matchdayIncome + performanceBonus - wageCost - overWagePenalty - academyCost;
  const balanceAfter = finance.cashBalance + netChange;
  const resultLabel = userResult ? getResultLabel(userResult, userTeam.id) : "fara meci";

  return {
    finance: {
      ...finance,
      cashBalance: balanceAfter,
    },
    report: {
      id: `finance-s${seasonNumber}-r${round}`,
      seasonNumber,
      round,
      sponsorIncome,
      matchdayIncome,
      performanceBonus,
      wageCost,
      overWagePenalty,
      academyCost,
      netChange,
      balanceAfter,
      summary: `Runda ${round}: ${resultLabel}, net ${netChange >= 0 ? "+" : ""}€${netChange.toLocaleString("en-US")}k${academyCost > 0 ? `, academy -€${academyCost.toLocaleString("en-US")}k` : ""}.`,
    },
  };
}
