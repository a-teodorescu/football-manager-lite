import { createMockLeagueTeams, simulateRound, defaultUserTactic } from "./leagueSimulation";
import { generateFixtures } from "./fixtureGenerator";
import { createInitialStandings } from "./standings";
import { buildMediaReport, buildRoundMediaMessage, createInitialMediaState } from "./mediaCenter";

const teams = createMockLeagueTeams();
const fixtures = generateFixtures(teams);
const standings = createInitialStandings(teams);
const sim = simulateRound(fixtures, standings, 1, 1, defaultUserTactic, teams);
const state = createInitialMediaState(1, teams[0].name);
const update = buildRoundMediaMessage({ state, seasonNumber: 1, round: 1, team: sim.updatedTeams[0], roundResults: sim.roundResults, standings: sim.updatedStandings });
const report = buildMediaReport(update.state);
if (!report.topHeadline) throw new Error("Media headline required.");
console.log("Media center OK", report.summary);
