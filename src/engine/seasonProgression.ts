import { generateFixtures, type Fixture } from "./fixtureGenerator";
import { createMockLeagueTeams, USER_TEAM_ID } from "./leagueSimulation";
import { clamp } from "./random";
import { createInitialStandings, type StandingRow } from "./standings";
import type { Player, Team } from "./types";
import { createInitialFinance, type ClubFinance } from "./finance";
import { getInitialTransferBudget } from "./transferMarket";
import { normalizeTeamStatus } from "./playerStatus";

export interface SeasonHistoryRecord {
  id: string;
  seasonNumber: number;
  championTeamId: string;
  championTeamName: string;
  userPosition: number;
  userPoints: number;
  userRecord: string;
  prizeMoney: number;
  cashAfterPrize: number;
  squadAverageAge: number;
  playerDevelopmentNotes: string[];
  summary: string;
}

export interface NextSeasonPreparation {
  seasonNumber: number;
  teams: Team[];
  fixtures: Fixture[];
  standings: StandingRow[];
  finance: ClubFinance;
  transferBudget: number;
  seasonRecord: SeasonHistoryRecord;
}

function deterministicScore(seed: string): number {
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return Math.abs(hash >>> 0) % 100;
}

function roundRating(value: number): number {
  return Math.round(clamp(value, 35, 94));
}

function getSeasonPrize(userPosition: number, leagueSize: number): number {
  if (userPosition === 1) return 9500;
  if (userPosition === 2) return 6800;
  if (userPosition === 3) return 5200;
  if (userPosition <= Math.ceil(leagueSize / 2)) return 3200;
  return 1800;
}

function getReputationDelta(userPosition: number, leagueSize: number): number {
  if (userPosition === 1) return 4;
  if (userPosition <= 3) return 2;
  if (userPosition <= Math.ceil(leagueSize / 2)) return 1;
  if (userPosition === leagueSize) return -2;
  return -1;
}

function getDevelopmentDelta(player: Player, seasonNumber: number): number {
  const score = deterministicScore(`${player.id}:season_progression:${seasonNumber}`);

  if (player.age <= 19) return 1 + (score % 3);
  if (player.age <= 23) return score % 3 === 0 ? 2 : 1;
  if (player.age <= 27) return score % 5 === 0 ? 1 : 0;
  if (player.age <= 30) return score % 9 === 0 ? 1 : 0;
  if (player.age <= 33) return score % 3 === 0 ? -1 : 0;
  return -1 - (score % 2);
}

function progressPlayerForNewSeason(player: Player, nextSeasonNumber: number): { player: Player; note?: string } {
  const previousOverall = player.overall;
  const delta = getDevelopmentDelta(player, nextSeasonNumber);
  const nextOverall = roundRating(player.overall + delta);
  const attributeDelta = nextOverall - player.overall;
  const score = deterministicScore(`${player.id}:reset:${nextSeasonNumber}`);
  const nextAge = player.age + 1;
  const nextPlayer: Player = {
    ...player,
    age: nextAge,
    overall: nextOverall,
    pace: roundRating(player.pace + attributeDelta - (nextAge >= 33 ? 1 : 0)),
    shooting: roundRating(player.shooting + attributeDelta),
    passing: roundRating(player.passing + attributeDelta),
    defending: roundRating(player.defending + attributeDelta),
    stamina: roundRating(player.stamina + attributeDelta - (nextAge >= 32 ? 1 : 0)),
    morale: Math.round(clamp(68 + (player.morale - 70) * 0.35 + (score % 9), 45, 95)),
    form: Math.round(clamp(62 + (score % 16), 45, 90)),
    fitness: 94 + (score % 7),
    injury: undefined,
    wage: player.wage ? Math.max(6, Math.round(player.wage * (1 + Math.max(-2, delta) * 0.015))) : player.wage,
  };

  const note =
    delta > 0
      ? `${player.name} a crescut OVR ${previousOverall} → ${nextOverall}.`
      : delta < 0
        ? `${player.name} a scazut OVR ${previousOverall} → ${nextOverall} dupa imbatranire.`
        : undefined;

  return { player: nextPlayer, note };
}

function progressUserTeamForNewSeason(team: Team, nextSeasonNumber: number, userPosition: number, leagueSize: number): { team: Team; notes: string[] } {
  const progressed = team.players.map((player) => progressPlayerForNewSeason(player, nextSeasonNumber));
  const players = progressed.map((item) => item.player);
  const notes = progressed
    .map((item) => item.note)
    .filter((note): note is string => Boolean(note))
    .slice(0, 8);
  const averageMorale = players.reduce((total, player) => total + player.morale, 0) / Math.max(1, players.length);

  return {
    team: normalizeTeamStatus({
      ...team,
      players,
      reputation: Math.round(clamp(team.reputation + getReputationDelta(userPosition, leagueSize), 50, 92)),
      morale: Math.round(clamp(averageMorale, 40, 95)),
    }),
    notes,
  };
}

function getUserStanding(standings: StandingRow[]): StandingRow {
  const fallback = standings[standings.length - 1];
  return standings.find((row) => row.teamId === USER_TEAM_ID) ?? fallback;
}

export function prepareNextSeason(input: {
  currentSeasonNumber: number;
  teams: Team[];
  standings: StandingRow[];
  finance: ClubFinance;
}): NextSeasonPreparation {
  const nextSeasonNumber = input.currentSeasonNumber + 1;
  const champion = input.standings[0];
  const userStanding = getUserStanding(input.standings);
  const userPosition = Math.max(1, input.standings.findIndex((row) => row.teamId === USER_TEAM_ID) + 1 || input.standings.length);
  const leagueSize = input.standings.length;
  const prizeMoney = getSeasonPrize(userPosition, leagueSize);
  const currentUserTeam = input.teams.find((team) => team.id === USER_TEAM_ID);

  if (!currentUserTeam) {
    throw new Error("User team not found while preparing next season.");
  }

  const progressedUserTeam = progressUserTeamForNewSeason(currentUserTeam, nextSeasonNumber, userPosition, leagueSize);
  const baseTeams = createMockLeagueTeams();
  const teams = baseTeams.map((team) => (team.id === USER_TEAM_ID ? progressedUserTeam.team : team));
  const fixtures = generateFixtures(teams);
  const standings = createInitialStandings(teams);
  const nextBaseFinance = createInitialFinance(nextSeasonNumber);
  const cashAfterPrize = Math.round(input.finance.cashBalance + prizeMoney);
  const finance: ClubFinance = {
    ...nextBaseFinance,
    cashBalance: cashAfterPrize,
    wageBudget: Math.max(nextBaseFinance.wageBudget, Math.round(input.finance.wageBudget * 1.06)),
    sponsorBase: Math.max(nextBaseFinance.sponsorBase, Math.round(input.finance.sponsorBase + Math.max(0, leagueSize + 1 - userPosition) * 18)),
  };
  const transferBudget = getInitialTransferBudget(nextSeasonNumber) + Math.round(prizeMoney * 0.35) + Math.max(0, Math.round(cashAfterPrize * 0.04));
  const squadAverageAge = Math.round((progressedUserTeam.team.players.reduce((total, player) => total + player.age, 0) / Math.max(1, progressedUserTeam.team.players.length)) * 10) / 10;

  return {
    seasonNumber: nextSeasonNumber,
    teams,
    fixtures,
    standings,
    finance,
    transferBudget,
    seasonRecord: {
      id: `season-${input.currentSeasonNumber}-summary`,
      seasonNumber: input.currentSeasonNumber,
      championTeamId: champion.teamId,
      championTeamName: champion.teamName,
      userPosition,
      userPoints: userStanding.points,
      userRecord: `${userStanding.wins}V-${userStanding.draws}E-${userStanding.losses}I`,
      prizeMoney,
      cashAfterPrize,
      squadAverageAge,
      playerDevelopmentNotes: progressedUserTeam.notes,
      summary: `Sezon ${input.currentSeasonNumber}: ${champion.teamName} campioana. ${userStanding.teamName} a terminat pe locul ${userPosition} cu ${userStanding.points} puncte si a primit €${prizeMoney.toLocaleString("en-US")}k prize money.`,
    },
  };
}
