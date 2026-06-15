import { Team } from "./types";

export interface Fixture {
  id: string;
  round: number;
  homeTeam: Team;
  awayTeam: Team;
  played: boolean;
}

function rotateTeams(teams: Team[]): Team[] {
  const [fixed, ...rest] = teams;
  const last = rest[rest.length - 1];
  const middle = rest.slice(0, rest.length - 1);

  return [fixed, last, ...middle];
}

export function generateFixtures(teams: Team[]): Fixture[] {
  if (teams.length < 2) return [];
  if (teams.length % 2 !== 0) {
    throw new Error("Fixture generator currently supports an even number of teams.");
  }

  const firstLeg: Fixture[] = [];
  let rotatingTeams = [...teams];
  let fixtureNumber = 1;
  const rounds = teams.length - 1;

  for (let round = 1; round <= rounds; round++) {
    for (let i = 0; i < teams.length / 2; i++) {
      const left = rotatingTeams[i];
      const right = rotatingTeams[rotatingTeams.length - 1 - i];

      const shouldSwap = round % 2 === 0;
      const homeTeam = shouldSwap ? right : left;
      const awayTeam = shouldSwap ? left : right;

      firstLeg.push({
        id: `fixture-${fixtureNumber++}`,
        round,
        homeTeam,
        awayTeam,
        played: false,
      });
    }

    rotatingTeams = rotateTeams(rotatingTeams);
  }

  const secondLeg = firstLeg.map((fixture) => ({
    id: `fixture-${fixtureNumber++}`,
    round: fixture.round + rounds,
    homeTeam: fixture.awayTeam,
    awayTeam: fixture.homeTeam,
    played: false,
  }));

  return [...firstLeg, ...secondLeg].sort((a, b) => {
    if (a.round !== b.round) return a.round - b.round;
    return a.id.localeCompare(b.id);
  });
}
