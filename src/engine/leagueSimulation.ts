import { Fixture, generateFixtures } from "./fixtureGenerator";
import { simulateMatch } from "./matchEngine";
import { createMockTeam } from "./mockData";
import { applyRoundStatusEffects, normalizeTeamStatus, type RoundStatusReport } from "./playerStatus";
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
  statusHistory: RoundStatusReport[];
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
  ].map(normalizeTeamStatus);
}

export function getMaxRound(fixtures: Fixture[]): number {
  return fixtures.reduce((max, fixture) => Math.max(max, fixture.round), 0);
}

function createTeamLookup(teams: Team[]): Map<string, Team> {
  return new Map(teams.map((team) => [team.id, normalizeTeamStatus(team)]));
}

function hydrateFixtureWithTeams(fixture: Fixture, teamsById: Map<string, Team>): Fixture {
  return {
    ...fixture,
    homeTeam: teamsById.get(fixture.homeTeam.id) ?? fixture.homeTeam,
    awayTeam: teamsById.get(fixture.awayTeam.id) ?? fixture.awayTeam,
  };
}

function hydrateFutureFixtures(fixtures: Fixture[], teams: Team[]): Fixture[] {
  const teamsById = createTeamLookup(teams);

  return fixtures.map((fixture) => {
    if (fixture.played) return fixture;
    return hydrateFixtureWithTeams(fixture, teamsById);
  });
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
  userTactic: Tactic,
  teams?: Team[]
): {
  roundResults: FixtureResult[];
  updatedFixtures: Fixture[];
  updatedStandings: StandingRow[];
  updatedTeams: Team[];
  statusReport: RoundStatusReport;
} {
  let nextStandings = standings;
  const baseTeams = teams?.length
    ? teams.map(normalizeTeamStatus)
    : Array.from(
        new Map(
          fixtures.flatMap((fixture) => [fixture.homeTeam, fixture.awayTeam]).map((team) => [team.id, normalizeTeamStatus(team)])
        ).values()
      );
  const baseTeamsById = createTeamLookup(baseTeams);

  const roundFixtures = fixtures
    .filter((fixture) => fixture.round === currentRound && !fixture.played)
    .map((fixture) => hydrateFixtureWithTeams(fixture, baseTeamsById));

  const roundResults = roundFixtures.map((fixture) => {
    const item = simulateFixture(fixture, seasonNumber, userTactic);
    nextStandings = updateStandings(nextStandings, item.result);
    return item;
  });

  const status = applyRoundStatusEffects(baseTeams, roundResults, seasonNumber, currentRound);
  const playedFixtureIds = new Set(roundResults.map((item) => item.fixture.id));
  const updatedFixtures = hydrateFutureFixtures(
    fixtures.map((fixture) =>
      playedFixtureIds.has(fixture.id) ? roundResults.find((item) => item.fixture.id === fixture.id)?.fixture ?? fixture : fixture
    ),
    status.teams
  );

  return {
    roundResults,
    updatedFixtures,
    updatedStandings: nextStandings,
    updatedTeams: status.teams,
    statusReport: status.report,
  };
}

export function simulateFullSeason(
  seasonNumber = 1,
  userTactic: Tactic = defaultUserTactic
): SeasonSimulationResult {
  let teams = createMockLeagueTeams();
  let fixtures = generateFixtures(teams);
  let standings = createInitialStandings(teams);
  let results: FixtureResult[] = [];
  const statusHistory: RoundStatusReport[] = [];
  const finalRound = getMaxRound(fixtures);

  for (let round = 1; round <= finalRound; round += 1) {
    const simulation = simulateRound(fixtures, standings, round, seasonNumber, userTactic, teams);
    teams = simulation.updatedTeams;
    fixtures = simulation.updatedFixtures;
    standings = simulation.updatedStandings;
    results = [...results, ...simulation.roundResults];
    statusHistory.unshift(simulation.statusReport);
  }

  return {
    teams,
    fixtures,
    results,
    standings,
    statusHistory,
  };
}
