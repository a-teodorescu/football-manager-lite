import { simulateFullSeason } from "./leagueSimulation";

const season = simulateFullSeason(1);

console.log("\nFINAL STANDINGS\n");

console.table(
  season.standings.map((row, index) => ({
    Pos: index + 1,
    Team: row.teamName,
    P: row.played,
    W: row.wins,
    D: row.draws,
    L: row.losses,
    GF: row.goalsFor,
    GA: row.goalsAgainst,
    GD: row.goalDifference,
    Pts: row.points,
  }))
);

console.log("\nSample results:\n");

for (const item of season.results.slice(0, 10)) {
  console.log(
    `Round ${item.fixture.round}: ${item.result.homeTeamName} ${item.result.homeScore} - ${item.result.awayScore} ${item.result.awayTeamName}`
  );
}
