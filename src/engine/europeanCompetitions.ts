import { Fixture } from "./fixtureGenerator";
import { FixtureResult, USER_TEAM_ID, getTeamTactic } from "./leagueSimulation";
import { simulateMatch } from "./matchEngine";
import { applyRoundStatusEffects, type RoundStatusReport } from "./playerStatus";
import { createSeededRandom } from "./random";
import type { MatchResult, Tactic, Team } from "./types";

export type EuropeanRoundName = "playoff" | "group" | "semi_final" | "final";
export type EuropeanStatus = "active" | "completed";

export interface EuropeanMatch {
  id: string;
  seasonNumber: number;
  roundIndex: number;
  roundName: EuropeanRoundName;
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

export interface EuropeanCompetitionState {
  seasonNumber: number;
  status: EuropeanStatus;
  currentRoundIndex: number;
  matches: EuropeanMatch[];
  championTeamId?: string;
  championTeamName?: string;
}

export interface EuropeanCompetitionRecord {
  id: string;
  seasonNumber: number;
  roundIndex: number;
  roundName: EuropeanRoundName;
  summary: string;
  userParticipated: boolean;
  userAdvanced: boolean;
  prizeMoney: number;
  championTeamName?: string;
}

export interface EuropeanRoundSimulation {
  state: EuropeanCompetitionState;
  teams: Team[];
  statusReport: RoundStatusReport;
  record: EuropeanCompetitionRecord;
  prizeMoney: number;
}

const ROUND_ORDER: EuropeanRoundName[] = ["playoff", "group", "semi_final", "final"];

const EUROPEAN_CLUBS: Array<{ id: string; name: string; reputation: number; country: string }> = [
  { id: "euro-lisbon", name: "Lisbon Eagles", reputation: 78, country: "Portugal" },
  { id: "euro-prague", name: "Prague Royals", reputation: 74, country: "Czechia" },
  { id: "euro-vienna", name: "Vienna Athletic", reputation: 72, country: "Austria" },
  { id: "euro-zagreb", name: "Zagreb Blue", reputation: 76, country: "Croatia" },
  { id: "euro-athens", name: "Athens United", reputation: 75, country: "Greece" },
  { id: "euro-warsaw", name: "Warsaw City", reputation: 71, country: "Poland" },
  { id: "euro-belgrade", name: "Belgrade Red", reputation: 77, country: "Serbia" },
  { id: "euro-sofia", name: "Sofia Lions", reputation: 70, country: "Bulgaria" },
  { id: "euro-oslo", name: "Oslo North", reputation: 73, country: "Norway" },
  { id: "euro-stockholm", name: "Stockholm Stars", reputation: 74, country: "Sweden" },
  { id: "euro-copenhagen", name: "Copenhagen Harbour", reputation: 76, country: "Denmark" },
  { id: "euro-helsinki", name: "Helsinki Ice", reputation: 69, country: "Finland" },
  { id: "euro-budapest", name: "Budapest Crown", reputation: 72, country: "Hungary" },
  { id: "euro-dublin", name: "Dublin Rovers", reputation: 68, country: "Ireland" },
  { id: "euro-brussels", name: "Brussels Union", reputation: 75, country: "Belgium" },
];

export function getEuropeanRoundLabel(roundName: EuropeanRoundName): string {
  if (roundName === "playoff") return "Playoff european";
  if (roundName === "group") return "Grupa europeana";
  if (roundName === "semi_final") return "Semifinale europene";
  return "Finala europeana";
}

export function getCurrentEuropeanRoundName(state: EuropeanCompetitionState): EuropeanRoundName {
  return ROUND_ORDER[Math.max(0, Math.min(ROUND_ORDER.length - 1, state.currentRoundIndex - 1))];
}

function clonePlayerForEuropeanClub(source: Team, clubId: string, clubName: string, index: number): Team["players"][number] {
  const player = source.players[index % source.players.length];
  const base = Math.max(55, Math.min(86, player.overall + ((index % 5) - 2)));

  return {
    ...player,
    id: `${clubId}-p-${index + 1}`,
    name: `${clubName.split(" ")[0]} ${index + 1}`,
    overall: base,
    pace: Math.max(45, Math.min(90, player.pace + ((index % 3) - 1))),
    shooting: Math.max(40, Math.min(90, player.shooting + ((index % 4) - 2))),
    passing: Math.max(40, Math.min(90, player.passing + ((index % 5) - 2))),
    defending: Math.max(40, Math.min(90, player.defending + ((index % 4) - 1))),
    stamina: Math.max(45, Math.min(90, player.stamina + ((index % 6) - 3))),
    morale: 70 + (index % 18),
    form: 66 + (index % 20),
    fitness: 100,
  };
}

function createEuropeanOpponent(templateTeams: Team[], club: (typeof EUROPEAN_CLUBS)[number]): Team {
  const template = templateTeams.find((team) => team.id !== USER_TEAM_ID) ?? templateTeams[0];
  const players = template.players.map((_, index) => clonePlayerForEuropeanClub(template, club.id, club.name, index));

  return {
    ...template,
    id: club.id,
    name: club.name,
    shortName: club.name.split(" ")[0],
    country: club.country,
    players,
    reputation: club.reputation,
    morale: 74,
  };
}

function buildEuropeanField(teams: Team[], seasonNumber: number): Team[] {
  const random = createSeededRandom(`europe-field-${seasonNumber}`);
  const userTeam = teams.find((team) => team.id === USER_TEAM_ID) ?? teams[0];
  const opponents = EUROPEAN_CLUBS
    .map((club) => createEuropeanOpponent(teams, club))
    .sort(() => random() - 0.5)
    .slice(0, 15);

  return [userTeam, ...opponents];
}

function createMatch(seasonNumber: number, roundIndex: number, matchIndex: number, homeTeam: Team, awayTeam: Team): EuropeanMatch {
  return {
    id: `euro-s${seasonNumber}-r${roundIndex}-m${matchIndex}`,
    seasonNumber,
    roundIndex,
    roundName: ROUND_ORDER[roundIndex - 1],
    homeTeamId: homeTeam.id,
    awayTeamId: awayTeam.id,
    homeTeamName: homeTeam.name,
    awayTeamName: awayTeam.name,
    played: false,
  };
}

function createMatchesFromTeams(seasonNumber: number, roundIndex: number, teams: Team[]): EuropeanMatch[] {
  const random = createSeededRandom(`europe-draw-s${seasonNumber}-r${roundIndex}`);
  const draw = [...teams].sort(() => random() - 0.5);
  const matches: EuropeanMatch[] = [];

  for (let index = 0; index < draw.length; index += 2) {
    const homeTeam = draw[index];
    const awayTeam = draw[index + 1];
    if (!homeTeam || !awayTeam) continue;
    matches.push(createMatch(seasonNumber, roundIndex, matches.length + 1, homeTeam, awayTeam));
  }

  return matches;
}

export function createInitialEuropeanCompetitionState(teams: Team[], seasonNumber: number): EuropeanCompetitionState {
  return {
    seasonNumber,
    status: "active",
    currentRoundIndex: 1,
    matches: createMatchesFromTeams(seasonNumber, 1, buildEuropeanField(teams, seasonNumber)),
  };
}

function createTeamLookup(teams: Team[], state: EuropeanCompetitionState): Map<string, Team> {
  const lookup = new Map(teams.map((team) => [team.id, team]));
  const europeanTeams = buildEuropeanField(teams, state.seasonNumber);
  for (const team of europeanTeams) lookup.set(team.id, team);
  return lookup;
}

function getWinner(match: EuropeanMatch, result: MatchResult): { teamId: string; decidedByPenalties: boolean } {
  if (result.homeScore > result.awayScore) return { teamId: match.homeTeamId, decidedByPenalties: false };
  if (result.awayScore > result.homeScore) return { teamId: match.awayTeamId, decidedByPenalties: false };

  const random = createSeededRandom(`${match.id}:euro-penalties`);
  return { teamId: random() < 0.5 ? match.homeTeamId : match.awayTeamId, decidedByPenalties: true };
}

function toFixture(match: EuropeanMatch, homeTeam: Team, awayTeam: Team): Fixture {
  return { id: match.id, round: match.roundIndex, homeTeam, awayTeam, played: true };
}

function getPrizeMoney(roundIndex: number, userParticipated: boolean, userAdvanced: boolean): number {
  if (!userParticipated) return 0;
  if (roundIndex === 1) return userAdvanced ? 1200 : 400;
  if (roundIndex === 2) return userAdvanced ? 1800 : 700;
  if (roundIndex === 3) return userAdvanced ? 2800 : 1100;
  return userAdvanced ? 6500 : 2200;
}

function getSummary(input: {
  roundName: EuropeanRoundName;
  userParticipated: boolean;
  userAdvanced: boolean;
  prizeMoney: number;
  championTeamName?: string;
}): string {
  const label = getEuropeanRoundLabel(input.roundName);
  if (input.championTeamName) {
    return input.userAdvanced
      ? `${input.championTeamName} a castigat competitia europeana. Bonus continental: €${input.prizeMoney.toLocaleString("en-US")}k.`
      : `${input.championTeamName} a castigat competitia europeana.`;
  }
  if (!input.userParticipated) return `${label}: clubul tau nu mai este in competitia europeana.`;
  if (input.userAdvanced) return `${label}: clubul tau s-a calificat si a primit €${input.prizeMoney.toLocaleString("en-US")}k.`;
  return `${label}: clubul tau a fost eliminat si a primit €${input.prizeMoney.toLocaleString("en-US")}k.`;
}

export function getUserEuropeanMatch(state: EuropeanCompetitionState): EuropeanMatch | undefined {
  if (state.status === "completed") return undefined;
  return state.matches.find(
    (match) =>
      match.roundIndex === state.currentRoundIndex &&
      !match.played &&
      (match.homeTeamId === USER_TEAM_ID || match.awayTeamId === USER_TEAM_ID),
  );
}

export function isUserStillInEurope(state: EuropeanCompetitionState): boolean {
  if (state.championTeamId) return state.championTeamId === USER_TEAM_ID;
  return state.matches.some((match) => {
    if (!match.played) return match.homeTeamId === USER_TEAM_ID || match.awayTeamId === USER_TEAM_ID;
    return match.winnerTeamId === USER_TEAM_ID;
  });
}

export function simulateEuropeanRound(input: {
  state: EuropeanCompetitionState;
  teams: Team[];
  seasonNumber: number;
  userTactic: Tactic;
}): EuropeanRoundSimulation {
  const { state, seasonNumber, userTactic } = input;
  if (state.status === "completed") throw new Error("Competitia europeana este deja terminata.");

  const teamsById = createTeamLookup(input.teams, state);
  const roundIndex = state.currentRoundIndex;
  const roundName = getCurrentEuropeanRoundName(state);
  const pendingMatches = state.matches.filter((match) => match.roundIndex === roundIndex && !match.played);
  if (!pendingMatches.length) throw new Error("Nu exista meciuri europene de simulat in runda curenta.");

  const winners: string[] = [];
  const fixtureResults: FixtureResult[] = [];
  const playedMatches = pendingMatches.map((match) => {
    const homeTeam = teamsById.get(match.homeTeamId);
    const awayTeam = teamsById.get(match.awayTeamId);
    if (!homeTeam || !awayTeam) throw new Error("Echipa lipsa din competitia europeana.");

    const result = simulateMatch({
      homeTeam,
      awayTeam,
      homeTactic: getTeamTactic(homeTeam.id, userTactic, homeTeam),
      awayTactic: getTeamTactic(awayTeam.id, userTactic, awayTeam),
      seed: `europe_s${seasonNumber}_${match.id}`,
    });
    const winner = getWinner(match, result);
    const winnerTeam = teamsById.get(winner.teamId)!;
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

  const userParticipated = pendingMatches.some((match) => match.homeTeamId === USER_TEAM_ID || match.awayTeamId === USER_TEAM_ID);
  const userAdvanced = winners.includes(USER_TEAM_ID);
  const finalRound = roundIndex >= ROUND_ORDER.length;
  const championTeamId = finalRound ? winners[0] : undefined;
  const championTeamName = championTeamId ? teamsById.get(championTeamId)?.name : undefined;
  const prizeMoney = getPrizeMoney(roundIndex, userParticipated, finalRound ? championTeamId === USER_TEAM_ID : userAdvanced);
  const nextMatches = finalRound
    ? []
    : createMatchesFromTeams(seasonNumber, roundIndex + 1, winners.map((teamId) => teamsById.get(teamId)!).filter(Boolean));

  const updatedState: EuropeanCompetitionState = {
    ...state,
    status: finalRound ? "completed" : "active",
    currentRoundIndex: finalRound ? roundIndex : roundIndex + 1,
    matches: [
      ...state.matches.filter((match) => !(match.roundIndex === roundIndex && !match.played)),
      ...playedMatches,
      ...nextMatches,
    ],
    championTeamId,
    championTeamName,
  };

  const statusUpdate = applyRoundStatusEffects(input.teams, fixtureResults, seasonNumber, 120 + roundIndex);

  return {
    state: updatedState,
    teams: statusUpdate.teams,
    statusReport: statusUpdate.report,
    prizeMoney,
    record: {
      id: `euro-record-s${seasonNumber}-r${roundIndex}`,
      seasonNumber,
      roundIndex,
      roundName,
      summary: getSummary({
        roundName,
        userParticipated,
        userAdvanced: finalRound ? championTeamId === USER_TEAM_ID : userAdvanced,
        prizeMoney,
        championTeamName,
      }),
      userParticipated,
      userAdvanced: finalRound ? championTeamId === USER_TEAM_ID : userAdvanced,
      prizeMoney,
      championTeamName,
    },
  };
}
