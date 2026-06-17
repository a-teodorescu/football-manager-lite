import { createMockLeagueTeams, defaultUserTactic, USER_TEAM_ID } from "./leagueSimulation";
import { buildAdvancedTacticsReport, calculateAdvancedTeamStrength, normalizeAdvancedTactic } from "./advancedTactics";

const team = createMockLeagueTeams().find((item) => item.id === USER_TEAM_ID);
if (!team) throw new Error("User team missing");

const tactic = normalizeAdvancedTactic({
  ...defaultUserTactic,
  mentality: "attacking",
  pressing: "high",
  tempo: "fast",
  width: "wide",
  risk: "risky",
  defensiveLine: "high",
  attackingFocus: "central",
});

const strength = calculateAdvancedTeamStrength(team, tactic);
const report = buildAdvancedTacticsReport(team, tactic);

if (strength.overall <= 0) throw new Error("Advanced strength should be positive");
if (report.roles.length === 0) throw new Error("Expected tactical roles");
if (report.risk.score < 0 || report.risk.score > 100) throw new Error("Risk score out of range");
if (report.tacticalScore < 1 || report.tacticalScore > 100) throw new Error("Tactical score out of range");
if (!report.summary.includes("Tactical score")) throw new Error("Missing summary");

console.log("Advanced tactics OK", {
  style: report.styleLabel,
  tacticalScore: report.tacticalScore,
  risk: report.risk.label,
  roles: report.roles.length,
});
