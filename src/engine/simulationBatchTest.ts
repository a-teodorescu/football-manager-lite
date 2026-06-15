import { simulateMatch } from "./matchEngine";
import { createMockTeam } from "./mockData";
import { Tactic } from "./types";

const homeTeam = createMockTeam("team-1", "FC Bucuresti", 74);
const awayTeam = createMockTeam("team-2", "Rapid Nord", 71);

const homeTactic: Tactic = {
  formation: "4-3-3",
  mentality: "attacking",
  pressing: "high",
};

const awayTactic: Tactic = {
  formation: "5-3-2",
  mentality: "defensive",
  pressing: "medium",
};

const totalMatches = 1000;

let homeWins = 0;
let draws = 0;
let awayWins = 0;

let totalGoals = 0;
let totalHomeGoals = 0;
let totalAwayGoals = 0;

let totalShots = 0;
let totalShotsOnTarget = 0;
let totalFouls = 0;
let totalYellowCards = 0;
let totalXg = 0;

let maxGoalsInMatch = 0;
let biggestHomeWin = 0;
let biggestAwayWin = 0;

const scoreDistribution = new Map<string, number>();

for (let i = 1; i <= totalMatches; i++) {
  const result = simulateMatch({
    homeTeam,
    awayTeam,
    homeTactic,
    awayTactic,
    seed: `batch_test_match_${i}`,
  });

  const goals = result.homeScore + result.awayScore;
  totalGoals += goals;
  totalHomeGoals += result.homeScore;
  totalAwayGoals += result.awayScore;

  totalShots += result.stats.homeShots + result.stats.awayShots;
  totalShotsOnTarget += result.stats.homeShotsOnTarget + result.stats.awayShotsOnTarget;
  totalFouls += result.stats.homeFouls + result.stats.awayFouls;
  totalYellowCards += result.stats.homeYellowCards + result.stats.awayYellowCards;
  totalXg += result.stats.homeXg + result.stats.awayXg;

  maxGoalsInMatch = Math.max(maxGoalsInMatch, goals);
  biggestHomeWin = Math.max(biggestHomeWin, result.homeScore - result.awayScore);
  biggestAwayWin = Math.max(biggestAwayWin, result.awayScore - result.homeScore);

  if (result.homeScore > result.awayScore) {
    homeWins++;
  } else if (result.homeScore < result.awayScore) {
    awayWins++;
  } else {
    draws++;
  }

  const scoreKey = `${result.homeScore}-${result.awayScore}`;
  scoreDistribution.set(scoreKey, (scoreDistribution.get(scoreKey) ?? 0) + 1);
}

const topScores = [...scoreDistribution.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .map(([score, count]) => ({ score, count, percentage: `${((count / totalMatches) * 100).toFixed(1)}%` }));

console.log("\n==============================");
console.log(" BATCH SIMULATION TEST");
console.log("==============================\n");

console.log(`Matches simulated: ${totalMatches}`);
console.log(`Home team: ${homeTeam.name} (${homeTactic.formation}, ${homeTactic.mentality}, ${homeTactic.pressing})`);
console.log(`Away team: ${awayTeam.name} (${awayTactic.formation}, ${awayTactic.mentality}, ${awayTactic.pressing})`);

console.log("\nResults:");
console.table({
  homeWins: `${homeWins} (${((homeWins / totalMatches) * 100).toFixed(1)}%)`,
  draws: `${draws} (${((draws / totalMatches) * 100).toFixed(1)}%)`,
  awayWins: `${awayWins} (${((awayWins / totalMatches) * 100).toFixed(1)}%)`,
});

console.log("\nAverages per match:");
console.table({
  goals: (totalGoals / totalMatches).toFixed(2),
  homeGoals: (totalHomeGoals / totalMatches).toFixed(2),
  awayGoals: (totalAwayGoals / totalMatches).toFixed(2),
  shots: (totalShots / totalMatches).toFixed(2),
  shotsOnTarget: (totalShotsOnTarget / totalMatches).toFixed(2),
  fouls: (totalFouls / totalMatches).toFixed(2),
  yellowCards: (totalYellowCards / totalMatches).toFixed(2),
  xg: (totalXg / totalMatches).toFixed(2),
});

console.log("\nExtremes:");
console.table({
  maxGoalsInMatch,
  biggestHomeWin,
  biggestAwayWin,
});

console.log("\nMost common scores:");
console.table(topScores);
