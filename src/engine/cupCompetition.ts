import { Fixture } from "./fixtureGenerator";
import { FixtureResult, USER_TEAM_ID, getTeamTactic } from "./leagueSimulation";
import { simulateMatch } from "./matchEngine";
import { applyRoundStatusEffects, type RoundStatusReport } from "./playerStatus";
import { createSeededRandom } from "./random";
import type { MatchResult, Tactic, Team } from "./types";

export type CupRoundName = "quarter_final" | "semi_final" | "final";
export type CupStatus = "active" | "completed";

export interface CupMatch {
  id: string;
  seasonNumber: number;
  roundIndex: number;
  roundName: CupRoundName;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  played: boolean;
  result?: MatchResult;
  winnerTeamId?: string;
  winnerTeamName?: string;
  decidedByPenalties?: boolean;
}

export interface CupState {
  seasonNumber: number;
  status: CupStatus;
  currentRoundIndex: number;
  matches: CupMatch[];
  championTeamId?: string;
  championTeamName?: string;
}

export interface CupRecord {
  id: string;
  seasonNumber: number;
  roundIndex: number;
  roundName: CupRoundName;
  summary: string;
  userParticipated: boolean;
  userAdvanced: boolean;
  prizeMoney: number;
  championTeamName?: string;
}

export interface CupRoundSimulation {
  cupState: CupState;
  teams: Team[];
  statusReport: RoundStatusReport;
  record: CupRecord;
  prizeMoney: number;
}

const CUP_ROUND_ORDER: CupRoundName[] = ["quarter_final", "semi_final", "final"];

export function getCupRoundLabel(roundName: CupRoundName): string {
  if (roundName === "quarter_final") return "Sferturi";
  if (roundName === "semi_final") return "Semifinale";
  return "Finala";
}

export function getCurrentCupRoundName(cupState: CupState): CupRoundName {
  return CUP_ROUND_ORDER[Math.max(0, Math.min(CUP_ROUND_ORDER.length - 1, cupState.currentRoundIndex - 1))];
}

function shuffleTeams(teams: Team[], seasonNumber: number): Team[] {
  const random = createSeededRandom(`cup-draw-s${seasonNumber}`);
  const shuffled = [...teams];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

function createCupMatch(
  seasonNumber: number,
  roundIndex: number,
  matchIndex: number,
  homeTeam: Team,
  awayTeam: Team
): CupMatch {
  return {
    id: `cup-s${seasonNumber}-r${roundIndex}-m${matchIndex}`,
    seasonNumber,
    roundIndex,
    roundName: CUP_ROUND_ORDER[roundIndex - 1],
    homeTeamId: homeTeam.id,
    awayTeamId: awayTeam.id,
    homeTeamName: homeTeam.name,
    awayTeamName: awayTeam.name,
    played: false,
  };
}

function createMatchesFromTeams(seasonNumber: number, roundIndex: number, teams: Team[]): CupMatch[] {
  const matches: CupMatch[] = [];

  for (let index = 0; index < teams.length; index += 2) {
    const homeTeam = teams[index];
    const awayTeam = teams[index + 1];
    if (!homeTeam || !awayTeam) continue;
    matches.push(createCupMatch(seasonNumber, roundIndex, matches.length + 1, homeTeam, awayTeam));
  }

  return matches;
}

export function createInitialCupState(teams: Team[], seasonNumber: number): CupState {
  const draw = shuffleTeams(teams, seasonNumber);

  return {
    seasonNumber,
    status: "active",
    currentRoundIndex: 1,
    matches: createMatchesFromTeams(seasonNumber, 1, draw),
  };
}

function createTeamLookup(teams: Team[]): Map<string, Team> {
  return new Map(teams.map((team) => [team.id, team]));
}

function getWinnerTeamId(match: CupMatch, result: MatchResult): { teamId: string; decidedByPenalties: boolean } {
  if (result.homeScore > result.awayScore) return { teamId: match.homeTeamId, decidedByPenalties: false };
  if (result.awayScore > result.homeScore) return { teamId: match.awayTeamId, decidedByPenalties: false };

  const random = createSeededRandom(`${match.id}:penalties`);
  return {
    teamId: random() < 0.5 ? match.homeTeamId : match.awayTeamId,
    decidedByPenalties: true,
  };
}

function toFixture(match: CupMatch, homeTeam: Team, awayTeam: Team): Fixture {
  return {
    id: match.id,
    round: match.roundIndex,
    homeTeam,
    awayTeam,
    played: true,
  };
}

function getPrizeMoney(roundIndex: number, userParticipated: boolean, userAdvanced: boolean): number {
  if (!userParticipated) return 0;

  if (roundIndex === 1) return userAdvanced ? 500 : 150;
  if (roundIndex === 2) return userAdvanced ? 900 : 300;
  return userAdvanced ? 2500 : 800;
}

function getRoundSummary(input: {
  roundName: CupRoundName;
  userParticipated: boolean;
  userAdvanced: boolean;
  prizeMoney: number;
  championTeamName?: string;
}): string {
  const label = getCupRoundLabel(input.roundName);

  if (input.championTeamName) {
    return input.userAdvanced
      ? `${input.championTeamName} a castigat cupa. Bonus trofeu: €${input.prizeMoney.toLocaleString("en-US")}k.`
      : `${input.championTeamName} a castigat cupa.`;
  }

  if (!input.userParticipated) return `${label}: clubul tau nu a mai fost in competitie.`;
  if (input.userAdvanced) return `${label}: clubul tau s-a calificat mai departe si a primit €${input.prizeMoney.toLocaleString("en-US")}k.`;
  return `${label}: clubul tau a fost eliminat si a primit €${input.prizeMoney.toLocaleString("en-US")}k.`;
}

export function getUserCupMatch(cupState: CupState): CupMatch | undefined {
  if (cupState.status === "completed") return undefined;

  return cupState.matches.find(
    (match) =>
      match.roundIndex === cupState.currentRoundIndex &&
      !match.played &&
      (match.homeTeamId === USER_TEAM_ID || match.awayTeamId === USER_TEAM_ID)
  );
}

export function isUserStillInCup(cupState: CupState): boolean {
  if (cupState.championTeamId) return cupState.championTeamId === USER_TEAM_ID;

  return cupState.matches.some((match) => {
    if (!match.played) return match.homeTeamId === USER_TEAM_ID || match.awayTeamId === USER_TEAM_ID;
    return match.winnerTeamId === USER_TEAM_ID;
  });
}

export function simulateCupRound(input: {
  cupState: CupState;
  teams: Team[];
  seasonNumber: number;
  userTactic: Tactic;
}): CupRoundSimulation {
  const { cupState, seasonNumber, userTactic } = input;

  if (cupState.status === "completed") {
    throw new Error("Cupa este deja terminata pentru sezonul curent.");
  }

  const teamsById = createTeamLookup(input.teams);
  const roundIndex = cupState.currentRoundIndex;
  const roundName = getCurrentCupRoundName(cupState);
  const pendingMatches = cupState.matches.filter((match) => match.roundIndex === roundIndex && !match.played);

  if (pendingMatches.length === 0) {
    throw new Error("Nu exista meciuri de cupa de simulat in aceasta runda.");
  }

  const winners: string[] = [];
  const fixtureResults: FixtureResult[] = [];
  const playedMatches = pendingMatches.map((match) => {
    const homeTeam = teamsById.get(match.homeTeamId);
    const awayTeam = teamsById.get(match.awayTeamId);

    if (!homeTeam || !awayTeam) {
      throw new Error("Echipa lipsa din cup draw.");
    }

    const result = simulateMatch({
      homeTeam,
      awayTeam,
      homeTactic: getTeamTactic(homeTeam.id, userTactic, homeTeam),
      awayTactic: getTeamTactic(awayTeam.id, userTactic, awayTeam),
      seed: `cup_s${seasonNumber}_${match.id}`,
    });
    const winner = getWinnerTeamId(match, result);
    const winnerTeam = winner.teamId === match.homeTeamId ? homeTeam : awayTeam;
    winners.push(winner.teamId);
    fixtureResults.push({ fixture: toFixture(match, homeTeam, awayTeam), result });

    return {
      ...match,
      played: true,
      result,
      winnerTeamId: winner.teamId,
      winnerTeamName: winnerTeam.name,
      decidedByPenalties: winner.decidedByPenalties,
    };
  });

  const statusUpdate = applyRoundStatusEffects(input.teams, fixtureResults, seasonNumber, 100 + roundIndex);
  const updatedTeamsById = createTeamLookup(statusUpdate.teams);
  const userMatch = playedMatches.find((match) => match.homeTeamId === USER_TEAM_ID || match.awayTeamId === USER_TEAM_ID);
  const userParticipated = Boolean(userMatch);
  const userAdvanced = userMatch?.winnerTeamId === USER_TEAM_ID;
  const prizeMoney = getPrizeMoney(roundIndex, userParticipated, userAdvanced);
  const isFinal = roundIndex >= CUP_ROUND_ORDER.length;
  const championTeamId = isFinal ? winners[0] : undefined;
  const championTeamName = championTeamId ? updatedTeamsById.get(championTeamId)?.name : undefined;
  const nextRoundIndex = roundIndex + 1;
  const nextMatches = isFinal
    ? []
    : createMatchesFromTeams(
        seasonNumber,
        nextRoundIndex,
        winners.map((teamId) => updatedTeamsById.get(teamId)).filter((team): team is Team => Boolean(team))
      );

  const nextMatchesById = new Map(playedMatches.map((match) => [match.id, match]));
  const existingMatches = cupState.matches.map((match) => nextMatchesById.get(match.id) ?? match);
  const nextCupState: CupState = {
    ...cupState,
    status: isFinal ? "completed" : "active",
    currentRoundIndex: isFinal ? roundIndex : nextRoundIndex,
    matches: [...existingMatches, ...nextMatches],
    championTeamId,
    championTeamName,
  };

  const record: CupRecord = {
    id: `cup-record-s${seasonNumber}-r${roundIndex}`,
    seasonNumber,
    roundIndex,
    roundName,
    summary: getRoundSummary({ roundName, userParticipated, userAdvanced, prizeMoney, championTeamName }),
    userParticipated,
    userAdvanced,
    prizeMoney,
    championTeamName,
  };

  return {
    cupState: nextCupState,
    teams: statusUpdate.teams,
    statusReport: {
      ...statusUpdate.report,
      summary: `Cupa ${getCupRoundLabel(roundName)}: ${statusUpdate.report.summary}`,
    },
    record,
    prizeMoney,
  };
}
