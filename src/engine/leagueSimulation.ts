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

export const USER_TEAM_ID = "team-1";

export const defaultTactic: Tactic = {
  formation: "4-2-3-1",
  mentality: "balanced",
  pressing: "medium",
};

export const defaultUserTactic: Tactic = {
  formation: "4-3-3",
  mentality: "attacking",
  pressing: "high",
};

const teamTactics: Record<string, Tactic> = {
  "team-1": defaultUserTactic,
  "team-2": { formation: "4-4-2", mentality: "balanced", pressing: "high" },
  "team-3": { formation: "5-3-2", mentality: "defensive", pressing: "medium" },
  "team-4": { formation: "4-2-3-1", mentality: "balanced", pressing: "medium" },
  "team-5": { formation: "4-4-2", mentality: "balanced", pressing: "medium" },
  "team-6": { formation: "5-3-2", mentality: "defensive", pressing: "low" },
  "team-7": { formation: "4-3-3", mentality: "attacking", pressing: "medium" },
  "team-8": { formation: "4-2-3-1", mentality: "defensive", pressing: "medium" },
};

export function getTeamTactic(teamId: string, userTactic?: Tactic): Tactic {
  if (teamId === USER_TEAM_ID && userTactic) {
    return userTactic;
  }

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

export function getMaxRound(fixtures: Fixture[]): number {
  return fixtures.reduce((max, fixture) => Math.max(max, fixture.round), 0);
}

export function simulateFixture(
  fixture: Fixture,
  seasonNumber: number,
  userTactic: Tactic
): FixtureResult {
  const result = simulateMatch({
    homeTeam: fixture.homeTeam,
    awayTeam: fixture.awayTeam,
    homeTactic: getTeamTactic(fixture.homeTeam.id, userTactic),
    awayTactic: getTeamTactic(fixture.awayTeam.id, userTactic),
    seed: `season_${seasonNumber}_${fixture.id}`,
  });

  return {
    fixture: { ...fixture, played: true },
    result,
  };
}

export function simulateRound(
  fixtures: Fixture[],
  standings: StandingRow[],
  currentRound: number,
  seasonNumber: number,
  userTactic: Tactic
): {
  roundResults: FixtureResult[];
  updatedFixtures: Fixture[];
  updatedStandings: StandingRow[];
} {
  let nextStandings = standings;

  const roundFixtures = fixtures.filter(
    (fixture) => fixture.round === currentRound && !fixture.played
  );

  const roundResults = roundFixtures.map((fixture) => {
    const item = simulateFixture(fixture, seasonNumber, userTactic);
    nextStandings = updateStandings(nextStandings, item.result);
    return item;
  });

  const playedFixtureIds = new Set(roundResults.map((item) => item.fixture.id));
  const updatedFixtures = fixtures.map((fixture) =>
    playedFixtureIds.has(fixture.id) ? { ...fixture, played: true } : fixture
  );

  return {
    roundResults,
    updatedFixtures,
    updatedStandings: nextStandings,
  };
}

export function simulateFullSeason(
  seasonNumber = 1,
  userTactic: Tactic = defaultUserTactic
): SeasonSimulationResult {
  const teams = createMockLeagueTeams();
  const fixtures = generateFixtures(teams);

  let standings = createInitialStandings(teams);

  const results = fixtures.map((fixture) => {
    const item = simulateFixture(fixture, seasonNumber, userTactic);
    standings = updateStandings(standings, item.result);
    return item;
  });

  return {
    teams,
    fixtures: fixtures.map((fixture) => ({ ...fixture, played: true })),
    results,
    standings,
  };
}
