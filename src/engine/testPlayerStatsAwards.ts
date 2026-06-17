import { simulateFullSeason } from "./leagueSimulation";
import { buildPlayerStatsAwardsReport } from "./playerStatsAwards";

const season = simulateFullSeason(1);
const team = season.teams[0];
const report = buildPlayerStatsAwardsReport({ team, results: season.results, standings: season.standings, seasonNumber: 1 });
if (report.stats.length !== team.players.length) throw new Error("All squad players should have stats.");
if (report.awards.length < 4) throw new Error("Awards should be generated.");
console.log("Stats awards OK", report.summary);
