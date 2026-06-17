import { createMockTeam } from "./mockData";
import type { Fixture } from "./fixtureGenerator";
import type {
  Tactic,
  Team,
  TeamAmbition,
  TeamTacticalStyle,
} from "./types";
import type { StandingRow } from "./standings";

export type LeagueTier = "title_favorite" | "contender" | "mid_table" | "underdog";

export interface TeamIdentity {
  teamId: string;
  name: string;
  shortName: string;
  city: string;
  stadium: string;
  country: string;
  primaryColor: string;
  secondaryColor: string;
  baseOverall: number;
  tacticalStyle: TeamTacticalStyle;
  ambition: TeamAmbition;
  rivalTeamId: string;
  fanbase: number;
}

export interface LeagueTeamSnapshot {
  teamId: string;
  name: string;
  shortName: string;
  city: string;
  stadium: string;
  tacticalStyle: TeamTacticalStyle;
  ambition: TeamAmbition;
  tier: LeagueTier;
  reputation: number;
  fanbase: number;
  averageOverall: number;
  position?: number;
  points?: number;
  formSummary: string;
  rivalTeamName?: string;
  isUserClub: boolean;
}

export interface LeagueRivalry {
  id: string;
  teamA: string;
  teamB: string;
  label: string;
  intensity: number;
}

export interface FixtureOfTheWeek {
  fixtureId: string;
  round: number;
  homeTeamName: string;
  awayTeamName: string;
  headline: string;
  importance: number;
}

export interface LeagueOverview {
  leagueName: string;
  country: string;
  totalTeams: number;
  totalRounds: number;
  currentRound: number;
  userClubPosition?: number;
  userClubTier?: LeagueTier;
  titleRaceSummary: string;
  pressureZoneSummary: string;
  fixtureOfTheWeek?: FixtureOfTheWeek;
  rivalries: LeagueRivalry[];
  teams: LeagueTeamSnapshot[];
}

export const LEAGUE_NAME = "Carpathian Super League";
export const LEAGUE_COUNTRY = "Romania";

const identities: TeamIdentity[] = [
  {
    teamId: "team-1",
    name: "FC Bucuresti",
    shortName: "FCB",
    city: "Bucuresti",
    stadium: "Arena Militari",
    country: LEAGUE_COUNTRY,
    primaryColor: "#2563eb",
    secondaryColor: "#f8fafc",
    baseOverall: 74,
    tacticalStyle: "pressing",
    ambition: "europe",
    rivalTeamId: "team-2",
    fanbase: 78,
  },
  {
    teamId: "team-2",
    name: "Rapid Nord",
    shortName: "RPN",
    city: "Bucuresti",
    stadium: "Giulesti Park",
    country: LEAGUE_COUNTRY,
    primaryColor: "#7f1d1d",
    secondaryColor: "#fbbf24",
    baseOverall: 73,
    tacticalStyle: "direct",
    ambition: "europe",
    rivalTeamId: "team-1",
    fanbase: 86,
  },
  {
    teamId: "team-3",
    name: "Dinamo Est",
    shortName: "DNE",
    city: "Bucuresti",
    stadium: "Stefan Arena",
    country: LEAGUE_COUNTRY,
    primaryColor: "#dc2626",
    secondaryColor: "#ffffff",
    baseOverall: 71,
    tacticalStyle: "counter",
    ambition: "mid_table",
    rivalTeamId: "team-2",
    fanbase: 73,
  },
  {
    teamId: "team-4",
    name: "Cluj United",
    shortName: "CLU",
    city: "Cluj-Napoca",
    stadium: "Somes Arena",
    country: LEAGUE_COUNTRY,
    primaryColor: "#111827",
    secondaryColor: "#d1d5db",
    baseOverall: 75,
    tacticalStyle: "possession",
    ambition: "title",
    rivalTeamId: "team-5",
    fanbase: 81,
  },
  {
    teamId: "team-5",
    name: "Timisoara Athletic",
    shortName: "TIM",
    city: "Timisoara",
    stadium: "Banat Stadium",
    country: LEAGUE_COUNTRY,
    primaryColor: "#7c3aed",
    secondaryColor: "#ffffff",
    baseOverall: 70,
    tacticalStyle: "balanced",
    ambition: "mid_table",
    rivalTeamId: "team-4",
    fanbase: 66,
  },
  {
    teamId: "team-6",
    name: "Brasov Wolves",
    shortName: "BRW",
    city: "Brasov",
    stadium: "Tampa Ground",
    country: LEAGUE_COUNTRY,
    primaryColor: "#f59e0b",
    secondaryColor: "#1f2937",
    baseOverall: 69,
    tacticalStyle: "defensive",
    ambition: "survival",
    rivalTeamId: "team-8",
    fanbase: 55,
  },
  {
    teamId: "team-7",
    name: "Constanta Stars",
    shortName: "CST",
    city: "Constanta",
    stadium: "Black Sea Arena",
    country: LEAGUE_COUNTRY,
    primaryColor: "#0ea5e9",
    secondaryColor: "#f8fafc",
    baseOverall: 72,
    tacticalStyle: "pressing",
    ambition: "europe",
    rivalTeamId: "team-6",
    fanbase: 69,
  },
  {
    teamId: "team-8",
    name: "Iasi City",
    shortName: "IAS",
    city: "Iasi",
    stadium: "Copou Road",
    country: LEAGUE_COUNTRY,
    primaryColor: "#1d4ed8",
    secondaryColor: "#facc15",
    baseOverall: 68,
    tacticalStyle: "counter",
    ambition: "survival",
    rivalTeamId: "team-6",
    fanbase: 58,
  },
];

export const TEAM_IDENTITIES: Record<string, TeamIdentity> = Object.fromEntries(
  identities.map((identity) => [identity.teamId, identity]),
);

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function applyTeamIdentity(team: Team): Team {
  const identity = TEAM_IDENTITIES[team.id];
  if (!identity) return team;

  return {
    ...team,
    name: team.name || identity.name,
    shortName: team.shortName ?? identity.shortName,
    city: team.city ?? identity.city,
    stadium: team.stadium ?? identity.stadium,
    country: team.country ?? identity.country,
    primaryColor: team.primaryColor ?? identity.primaryColor,
    secondaryColor: team.secondaryColor ?? identity.secondaryColor,
    tacticalStyle: team.tacticalStyle ?? identity.tacticalStyle,
    ambition: team.ambition ?? identity.ambition,
    rivalTeamId: team.rivalTeamId ?? identity.rivalTeamId,
    fanbase: team.fanbase ?? identity.fanbase,
  };
}

export function createExpandedLeagueTeams(): Team[] {
  return identities.map((identity) =>
    applyTeamIdentity(
      createMockTeam(identity.teamId, identity.name, identity.baseOverall),
    ),
  );
}

export function getTeamStyleLabel(style?: TeamTacticalStyle): string {
  if (style === "possession") return "Possession";
  if (style === "direct") return "Direct";
  if (style === "counter") return "Counter";
  if (style === "pressing") return "High press";
  if (style === "defensive") return "Defensive block";
  return "Balanced";
}

export function getTeamAmbitionLabel(ambition?: TeamAmbition): string {
  if (ambition === "title") return "Title challenge";
  if (ambition === "europe") return "Top half";
  if (ambition === "survival") return "Survival";
  return "Mid-table";
}

export function getTacticForTeamStyle(style?: TeamTacticalStyle): Tactic {
  if (style === "possession") {
    return { formation: "4-2-3-1", mentality: "balanced", pressing: "medium" };
  }
  if (style === "direct") {
    return { formation: "4-4-2", mentality: "attacking", pressing: "high" };
  }
  if (style === "counter") {
    return { formation: "5-3-2", mentality: "defensive", pressing: "medium" };
  }
  if (style === "pressing") {
    return { formation: "4-3-3", mentality: "attacking", pressing: "high" };
  }
  if (style === "defensive") {
    return { formation: "5-3-2", mentality: "defensive", pressing: "low" };
  }
  return { formation: "4-2-3-1", mentality: "balanced", pressing: "medium" };
}

export function getLeagueTier(reputation: number): LeagueTier {
  if (reputation >= 75) return "title_favorite";
  if (reputation >= 72) return "contender";
  if (reputation >= 70) return "mid_table";
  return "underdog";
}

export function getLeagueTierLabel(tier: LeagueTier): string {
  if (tier === "title_favorite") return "Title favorite";
  if (tier === "contender") return "Contender";
  if (tier === "mid_table") return "Mid-table";
  return "Underdog";
}

function getAverageOverall(team: Team): number {
  return Math.round(average(team.players.map((player) => player.overall)));
}

function getFormSummary(teamId: string, standings: StandingRow[]): string {
  const row = standings.find((item) => item.teamId === teamId);
  if (!row || row.played === 0) return "No league games yet";

  const pointsPerGame = row.points / row.played;
  if (pointsPerGame >= 2.1) return "Excellent form";
  if (pointsPerGame >= 1.55) return "Good form";
  if (pointsPerGame >= 1.05) return "Mixed form";
  return "Under pressure";
}

function getFixtureImportance(
  fixture: Fixture,
  standings: StandingRow[],
  userTeamId: string,
): number {
  const homePosition = standings.findIndex((row) => row.teamId === fixture.homeTeam.id) + 1;
  const awayPosition = standings.findIndex((row) => row.teamId === fixture.awayTeam.id) + 1;
  const positionGap = Math.abs((homePosition || 8) - (awayPosition || 8));
  const topTableBonus = (homePosition <= 4 || awayPosition <= 4) ? 18 : 0;
  const userBonus = fixture.homeTeam.id === userTeamId || fixture.awayTeam.id === userTeamId ? 22 : 0;
  const derbyBonus = fixture.homeTeam.rivalTeamId === fixture.awayTeam.id || fixture.awayTeam.rivalTeamId === fixture.homeTeam.id ? 20 : 0;

  return Math.max(1, 100 - positionGap * 8 + topTableBonus + userBonus + derbyBonus);
}

function getFixtureHeadline(fixture: Fixture): string {
  if (fixture.homeTeam.rivalTeamId === fixture.awayTeam.id || fixture.awayTeam.rivalTeamId === fixture.homeTeam.id) {
    return "Derby round highlight";
  }
  if (fixture.homeTeam.ambition === "title" || fixture.awayTeam.ambition === "title") {
    return "Title-race pressure match";
  }
  return "Key league fixture";
}

function getFixtureOfTheWeek(
  fixtures: Fixture[],
  currentRound: number,
  standings: StandingRow[],
  userTeamId: string,
): FixtureOfTheWeek | undefined {
  const candidates = fixtures.filter((fixture) => fixture.round === currentRound && !fixture.played);
  const ranked = candidates
    .map((fixture) => ({ fixture, importance: getFixtureImportance(fixture, standings, userTeamId) }))
    .sort((a, b) => b.importance - a.importance);
  const item = ranked[0];
  if (!item) return undefined;

  return {
    fixtureId: item.fixture.id,
    round: item.fixture.round,
    homeTeamName: item.fixture.homeTeam.name,
    awayTeamName: item.fixture.awayTeam.name,
    headline: getFixtureHeadline(item.fixture),
    importance: Math.min(100, Math.round(item.importance)),
  };
}

export function getLeagueRivalries(teams: Team[]): LeagueRivalry[] {
  const byId = new Map(teams.map((team) => [team.id, applyTeamIdentity(team)]));
  const seen = new Set<string>();
  const rivalries: LeagueRivalry[] = [];

  for (const team of teams.map(applyTeamIdentity)) {
    if (!team.rivalTeamId) continue;
    const rival = byId.get(team.rivalTeamId);
    if (!rival) continue;
    const key = [team.id, rival.id].sort().join(":");
    if (seen.has(key)) continue;
    seen.add(key);

    rivalries.push({
      id: key,
      teamA: team.name,
      teamB: rival.name,
      label: team.city === rival.city ? "City derby" : "Regional rivalry",
      intensity: Math.min(100, Math.round(((team.fanbase ?? 60) + (rival.fanbase ?? 60)) / 2)),
    });
  }

  return rivalries.sort((a, b) => b.intensity - a.intensity);
}

function getTitleRaceSummary(standings: StandingRow[]): string {
  if (standings.length === 0 || standings[0].played === 0) {
    return "Title race not started yet.";
  }

  const leader = standings[0];
  const second = standings[1];
  if (!second) return `${leader.teamName} leads the league.`;

  const gap = leader.points - second.points;
  if (gap === 0) return `${leader.teamName} leads on tiebreakers, but the title race is level on points.`;
  if (gap <= 3) return `${leader.teamName} leads by only ${gap} points.`;
  return `${leader.teamName} has opened a ${gap}-point gap.`;
}

function getPressureZoneSummary(standings: StandingRow[]): string {
  if (standings.length === 0 || standings[0].played === 0) {
    return "No pressure zone yet.";
  }

  const bottom = standings.slice(-2).map((row) => row.teamName).join(" and ");
  return `${bottom} are currently in the pressure zone.`;
}

export function buildLeagueOverview(input: {
  teams: Team[];
  standings: StandingRow[];
  fixtures: Fixture[];
  currentRound: number;
  maxRound: number;
  userTeamId: string;
}): LeagueOverview {
  const teams = input.teams.map(applyTeamIdentity);
  const standingsPositions = new Map(input.standings.map((row, index) => [row.teamId, index + 1]));
  const standingsById = new Map(input.standings.map((row) => [row.teamId, row]));
  const teamsById = new Map(teams.map((team) => [team.id, team]));
  const userClub = teamsById.get(input.userTeamId);

  const snapshots = teams
    .map((team): LeagueTeamSnapshot => {
      const standing = standingsById.get(team.id);
      const tier = getLeagueTier(team.reputation);
      const rival = team.rivalTeamId ? teamsById.get(team.rivalTeamId) : undefined;

      return {
        teamId: team.id,
        name: team.name,
        shortName: team.shortName ?? team.name.slice(0, 3).toUpperCase(),
        city: team.city ?? "Unknown",
        stadium: team.stadium ?? "Club Stadium",
        tacticalStyle: team.tacticalStyle ?? "balanced",
        ambition: team.ambition ?? "mid_table",
        tier,
        reputation: team.reputation,
        fanbase: team.fanbase ?? 60,
        averageOverall: getAverageOverall(team),
        position: standingsPositions.get(team.id),
        points: standing?.points,
        formSummary: getFormSummary(team.id, input.standings),
        rivalTeamName: rival?.name,
        isUserClub: team.id === input.userTeamId,
      };
    })
    .sort((a, b) => {
      const positionA = a.position ?? 999;
      const positionB = b.position ?? 999;
      if (positionA !== positionB) return positionA - positionB;
      return b.reputation - a.reputation;
    });

  return {
    leagueName: LEAGUE_NAME,
    country: LEAGUE_COUNTRY,
    totalTeams: teams.length,
    totalRounds: input.maxRound,
    currentRound: input.currentRound,
    userClubPosition: standingsPositions.get(input.userTeamId),
    userClubTier: userClub ? getLeagueTier(userClub.reputation) : undefined,
    titleRaceSummary: getTitleRaceSummary(input.standings),
    pressureZoneSummary: getPressureZoneSummary(input.standings),
    fixtureOfTheWeek: getFixtureOfTheWeek(input.fixtures, input.currentRound, input.standings, input.userTeamId),
    rivalries: getLeagueRivalries(teams),
    teams: snapshots,
  };
}
