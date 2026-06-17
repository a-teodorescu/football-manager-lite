import { createMockLeagueTeams, USER_TEAM_ID } from "./leagueSimulation";
import { buildStaffImpact, createInitialStaffState, hireStaffMember, refreshStaffCandidates } from "./staffCoaching";

const team = createMockLeagueTeams().find((item) => item.id === USER_TEAM_ID)!;
const state = createInitialStaffState(1, team);
const impact = buildStaffImpact(state);
if (state.members.length < 6) throw new Error("Initial staff must cover six roles.");
if (impact.totalWage <= 0) throw new Error("Staff wage must be positive.");
const refresh = refreshStaffCandidates({ state, seasonNumber: 1, round: 2, team });
const hiring = hireStaffMember({ state: refresh.state, candidateId: refresh.state.candidates[0].id, seasonNumber: 1, round: 2 });
if (hiring.signingCost <= 0) throw new Error("Hiring must have signing cost.");
console.log("Staff coaching OK", buildStaffImpact(hiring.state).summary);
