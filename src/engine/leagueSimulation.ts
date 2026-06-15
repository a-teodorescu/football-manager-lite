import { Fixture, generateFixtures } from "./fixtureGenerator";
import { simulateMatch } from "./matchEngine";
import { createMockTeam } from "./mockData";
import { createInitialStandings, StandingRow, updateStandings } from "./standings";
import { MatchResult, Tactic, Team } from "./types";

export interface FixtureResult {
  fixture: Fixture;
  result: MatchResult;
}

export interface SeasonSimulationResult {
  teams: Team[];
  fixtures: Fixture[];
  results: FixtureResult[];
  standings: StandingRow[];
}

export const defaultTactic: Tactic = {
  formation: "4-2-3-1",
  mentality: "balanced",
  pressing: "medium",
};

const teamTactics: Record<string, Tactic> = {
  "team-1": { formation: "4-3-3", mentality: "attacking", pressing: "high" },
  "team-2": { formation: "4-4-2", mentality: "balanced", pressing: "high" },
  "team-3": { formation: "5-3-2", mentality: "defensive", pressing: "medium" },
  "team-4": { formation: "4-2-3-1", mentality: "balanced", pressing: "medium" },
  "team-5": { formation: "4-4-2", mentality: "balanced", pressing: "medium" },
  "team-6": { formation: "5-3-2", mentality: "defensive", pressing: "low" },
  "team-7": { formation: "4-3-3", mentality: "attacking", pressing: "medium" },
  "team-8": { formation: "4-2-3-1", mentality: "defensive", pressing: "medium" },
};

export function getTeamTactic(teamId: string): Tactic {
  return teamTactics[teamId] ?? defaultTactic;
}

export function createMockLeagueTeams(): Team[] {
  return [
    createMockTeam("team-1", "FC Bucuresti", 74),
    createMockTeam("team-2", "Rapid Nord", 72),
    createMockTeam("team-3", "Dinamo Est", 70),
    createMockTeam("team-4", "Cluj United", 73),
    createMockTeam("team-5", "Timisoara Athletic", 69),
    createMockTeam("team-6", "Brasov Wolves", 68),
    createMockTeam("team-7", "Constanta Stars", 71),
    createMockTeam("team-8", "Iasi City", 67),
  ];
}

export function simulateFullSeason(seasonNumber = 1): SeasonSimulationResult {
  const teams = createMockLeagueTeams();
  const fixtures = generateFixtures(teams);

  let standings = createInitialStandings(teams);

  const results = fixtures.map((fixture) => {
    const result = simulateMatch({
      homeTeam: fixture.homeTeam,
      awayTeam: fixture.awayTeam,
      homeTactic: getTeamTactic(fixture.homeTeam.id),
      awayTactic: getTeamTactic(fixture.awayTeam.id),
      seed: `season_${seasonNumber}_${fixture.id}`,
    });

    standings = updateStandings(standings, result);

    return {
      fixture: { ...fixture, played: true },
      result,
    };
  });

  return {
    teams,
    fixtures,
    results,
    standings,
  };
}
