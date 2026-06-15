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

const result = simulateMatch({
  homeTeam,
  awayTeam,
  homeTactic,
  awayTactic,
  seed: "season_1_match_1",
});

console.log("\n==============================");
console.log(" SINGLE MATCH SIMULATION");
console.log("==============================\n");

console.log(`${result.homeTeamName} ${result.homeScore} - ${result.awayScore} ${result.awayTeamName}`);

console.log("\nStats:");
console.table(result.stats);

console.log("\nEvents:");
for (const event of result.events) {
  console.log(`${event.minute}' - ${event.text}`);
}
