import { createMockLeagueTeams, simulateRound, defaultUserTactic } from "./leagueSimulation";
import { generateFixtures } from "./fixtureGenerator";
import { createInitialStandings } from "./standings";
import { createInitialFacilities } from "./stadiumFacilities";
import { buildFanReport, createInitialFanState, updateFanStateAfterRound } from "./fanExperience";

const teams = createMockLeagueTeams();
const fixtures = generateFixtures(teams);
const standings = createInitialStandings(teams);
const facilities = createInitialFacilities(teams[0], 1);
const sim = simulateRound(fixtures, standings, 1, 1, defaultUserTactic, teams);
const state = createInitialFanState(teams[0]);
const update = updateFanStateAfterRound({ state, team: sim.updatedTeams[0], standings: sim.updatedStandings, facilities, roundResults: sim.roundResults, seasonNumber: 1, round: 1 });
const report = buildFanReport({ state: update.state, team: sim.updatedTeams[0], standings: sim.updatedStandings, facilities });
if (report.projectedAttendance <= 0) throw new Error("Attendance should be positive.");
console.log("Fan experience OK", report.summary);
