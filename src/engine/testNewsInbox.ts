import { createInitialBoardState, evaluateBoard } from "./boardObjectives";
import { applyRoundFinances, createInitialFinance } from "./finance";
import { generateFixtures } from "./fixtureGenerator";
import { createMockLeagueTeams, defaultUserTactic, simulateRound, USER_TEAM_ID } from "./leagueSimulation";
import {
  addInboxMessages,
  buildClubSnapshotMessage,
  buildInboxSummary,
  buildRoundNewsMessages,
  createWelcomeInboxMessages,
  markAllInboxMessagesRead,
  markInboxMessageRead,
} from "./newsInbox";
import { createInitialStandings } from "./standings";

const teams = createMockLeagueTeams();
const fixtures = generateFixtures(teams);
const standings = createInitialStandings(teams);
const round = simulateRound(fixtures, standings, 1, 1, defaultUserTactic, teams);
const userTeam = round.updatedTeams.find((team) => team.id === USER_TEAM_ID);

if (!userTeam) {
  throw new Error("User team missing from test league.");
}

const financeUpdate = applyRoundFinances({
  finance: createInitialFinance(1),
  userTeam,
  roundResults: round.roundResults,
  standings: round.updatedStandings,
  seasonNumber: 1,
  round: 1,
});

const board = evaluateBoard({
  board: createInitialBoardState(1),
  team: userTeam,
  standings: round.updatedStandings,
  finance: financeUpdate.finance,
  transferBudget: 6000,
  academyLevel: 1,
  cupState: {
    seasonNumber: 1,
    status: "active",
    currentRoundIndex: 1,
    matches: [],
  },
  seasonNumber: 1,
  currentRound: 2,
  maxRound: 14,
  seasonFinished: false,
  forceReview: true,
});

const welcome = createWelcomeInboxMessages({ seasonNumber: 1, clubName: userTeam.name, city: userTeam.city });
const roundMessages = buildRoundNewsMessages({
  seasonNumber: 1,
  round: 1,
  clubName: userTeam.name,
  roundResults: round.roundResults,
  standings: round.updatedStandings,
  financeReport: financeUpdate.report,
  statusReport: round.statusReport,
  boardReview: board.review,
  userTeamId: USER_TEAM_ID,
});
const snapshot = buildClubSnapshotMessage({
  seasonNumber: 1,
  round: 1,
  team: userTeam,
  cashBalance: financeUpdate.finance.cashBalance,
  position: Math.max(1, round.updatedStandings.findIndex((row) => row.teamId === USER_TEAM_ID) + 1),
});

const inbox = addInboxMessages(welcome, [...roundMessages, snapshot]);
const summary = buildInboxSummary(inbox);

if (summary.totalCount < 4) {
  throw new Error(`Expected at least four inbox messages, received ${summary.totalCount}.`);
}

if (summary.unreadCount !== summary.totalCount) {
  throw new Error("New inbox messages should start unread.");
}

const firstRead = markInboxMessageRead(inbox, inbox[0].id);
if (buildInboxSummary(firstRead).unreadCount !== summary.totalCount - 1) {
  throw new Error("Mark message read should reduce unread count by one.");
}

const allRead = markAllInboxMessagesRead(inbox);
if (buildInboxSummary(allRead).unreadCount !== 0) {
  throw new Error("Mark all read should clear unread count.");
}

console.log("News inbox OK");
console.table(
  inbox.slice(0, 5).map((message) => ({
    Category: message.category,
    Tone: message.tone,
    Title: message.title,
    Target: message.targetTab,
  })),
);
