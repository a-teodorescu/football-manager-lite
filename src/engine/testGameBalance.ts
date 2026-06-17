import { createMockLeagueTeams } from "./leagueSimulation";
import { createInitialFinance } from "./finance";
import { buildBalanceReport, createInitialDifficultySettings, getDifficultyOptions } from "./gameBalance";

const team = createMockLeagueTeams()[0];
const options = getDifficultyOptions();
if (options.length < 4) throw new Error("Expected four difficulty options.");
const report = buildBalanceReport({ difficulty: createInitialDifficultySettings(), finance: createInitialFinance(1), team, jobSecurity: 70, wageBill: 900, squadValue: 20000 });
if (report.score <= 0) throw new Error("Balance score must be positive.");
console.log("Game balance OK", report.difficultyLabel, report.score);
