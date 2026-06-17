import { defaultUserTactic, getTeamTactic, createMockLeagueTeams } from "./leagueSimulation";
import { autoPickLineup } from "./lineupSelection";
import {
  autoPickSetPieces,
  buildSetPieceReport,
  scorePlayerForSetPieceRole,
  setSetPieceAssignment,
} from "./setPieces";
import { simulateMatch } from "./matchEngine";

const teams = createMockLeagueTeams();
const userBase = autoPickLineup(teams[0], defaultUserTactic.formation);
const userWithSetPieces = autoPickSetPieces(userBase, defaultUserTactic.formation);
const initialReport = buildSetPieceReport(userWithSetPieces, defaultUserTactic.formation);

if (initialReport.assignments.length !== 5) {
  throw new Error(`Expected 5 set-piece roles, got ${initialReport.assignments.length}.`);
}

if (!initialReport.isValid) {
  throw new Error(`Expected auto-picked set pieces to be valid: ${initialReport.summary}`);
}

const bestFreeKickTaker = [...userWithSetPieces.players].sort(
  (a, b) => scorePlayerForSetPieceRole(b, "freeKick") - scorePlayerForSetPieceRole(a, "freeKick"),
)[0];

if (!bestFreeKickTaker) throw new Error("No free-kick candidate found.");

const customTeam = setSetPieceAssignment(
  userWithSetPieces,
  "freeKick",
  bestFreeKickTaker.id,
  defaultUserTactic.formation,
);
const customReport = buildSetPieceReport(customTeam, defaultUserTactic.formation);
const freeKickAssignment = customReport.assignments.find((item) => item.role === "freeKick");

if (freeKickAssignment?.playerId !== bestFreeKickTaker.id) {
  throw new Error("Manual free-kick assignment was not saved.");
}

let resultWithSetPiece = simulateMatch({
  homeTeam: customTeam,
  awayTeam: autoPickSetPieces(autoPickLineup(teams[1], getTeamTactic(teams[1].id, undefined, teams[1]).formation), getTeamTactic(teams[1].id, undefined, teams[1]).formation),
  homeTactic: defaultUserTactic,
  awayTactic: getTeamTactic(teams[1].id, undefined, teams[1]),
  seed: "set-pieces-smoke-0",
});

for (let index = 1; index <= 80 && !resultWithSetPiece.events.some((event) => event.type === "set_piece"); index += 1) {
  resultWithSetPiece = simulateMatch({
    homeTeam: customTeam,
    awayTeam: autoPickSetPieces(autoPickLineup(teams[1], getTeamTactic(teams[1].id, undefined, teams[1]).formation), getTeamTactic(teams[1].id, undefined, teams[1]).formation),
    homeTactic: defaultUserTactic,
    awayTactic: getTeamTactic(teams[1].id, undefined, teams[1]),
    seed: `set-pieces-smoke-${index}`,
  });
}

const setPieceEvents = resultWithSetPiece.events.filter((event) => event.type === "set_piece");
if (setPieceEvents.length === 0) {
  throw new Error("Expected at least one set-piece event across deterministic smoke seeds.");
}

console.log("Set pieces test OK", {
  specialistScore: customReport.specialistScore,
  deadBallThreat: customReport.deadBallThreat,
  captain: customReport.assignments.find((item) => item.role === "captain")?.playerName,
  freeKickTaker: freeKickAssignment?.playerName,
  setPieceEvents: setPieceEvents.length,
});
