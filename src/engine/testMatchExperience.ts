import { buildMatchAnalysis, buildMatchPreview } from "./matchExperience";
import { createMockLeagueTeams, defaultUserTactic, simulateRound } from "./leagueSimulation";
import { generateFixtures } from "./fixtureGenerator";
import { createInitialStandings } from "./standings";

const teams = createMockLeagueTeams();
const fixtures = generateFixtures(teams);
const firstFixture = fixtures[0];

const preview = buildMatchPreview(firstFixture, defaultUserTactic);
if (!preview.headline || preview.keyRisks.length === 0) {
  throw new Error("Match preview should expose headline and key risks.");
}

const simulation = simulateRound(fixtures, createInitialStandings(teams), 1, 1, defaultUserTactic, teams);
const firstResult = simulation.roundResults[0];
const analysis = buildMatchAnalysis(firstResult, defaultUserTactic);

if (!analysis.manOfTheMatch || analysis.topPerformers.length !== 3) {
  throw new Error("Match analysis should expose man of the match and top performers.");
}

if (analysis.feedback.length === 0) {
  throw new Error("Match analysis should expose tactical feedback.");
}

console.log("Match experience test passed", {
  preview: preview.headline,
  motm: analysis.manOfTheMatch.playerName,
  feedbackItems: analysis.feedback.length,
});
