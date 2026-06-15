import { MatchResult, Team } from "./types";

export interface StandingRow {
  teamId: string;
  teamName: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export function createInitialStandings(teams: Team[]): StandingRow[] {
  return teams.map((team) => ({
    teamId: team.id,
    teamName: team.name,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  }));
}

export function updateStandings(
  standings: StandingRow[],
  result: MatchResult
): StandingRow[] {
  const nextStandings = standings.map((row) => ({ ...row }));
  const home = nextStandings.find((row) => row.teamId === result.homeTeamId);
  const away = nextStandings.find((row) => row.teamId === result.awayTeamId);

  if (!home || !away) {
    throw new Error("Team not found in standings.");
  }

  home.played += 1;
  away.played += 1;

  home.goalsFor += result.homeScore;
  home.goalsAgainst += result.awayScore;

  away.goalsFor += result.awayScore;
  away.goalsAgainst += result.homeScore;

  if (result.homeScore > result.awayScore) {
    home.wins += 1;
    home.points += 3;
    away.losses += 1;
  } else if (result.homeScore < result.awayScore) {
    away.wins += 1;
    away.points += 3;
    home.losses += 1;
  } else {
    home.draws += 1;
    away.draws += 1;
    home.points += 1;
    away.points += 1;
  }

  home.goalDifference = home.goalsFor - home.goalsAgainst;
  away.goalDifference = away.goalsFor - away.goalsAgainst;

  return sortStandings(nextStandings);
}

export function sortStandings(standings: StandingRow[]): StandingRow[] {
  return [...standings].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    if (b.wins !== a.wins) return b.wins - a.wins;

    return a.teamName.localeCompare(b.teamName);
  });
}
