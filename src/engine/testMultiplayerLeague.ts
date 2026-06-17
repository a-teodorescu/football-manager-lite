import { buildMultiplayerLeagueReport } from "./multiplayerLeague";

const report = buildMultiplayerLeagueReport({
  appVersion: "3.6.0",
  authenticated: true,
  supabaseConfigured: true,
  realDatabaseReadyScore: 88,
  userId: "user-123",
  managerName: "Alex",
  clubName: "Rapid Test FC",
  seasonNumber: 2,
  currentRound: 7,
  maxRound: 14,
  points: 22,
  position: 1,
  jobSecurity: 84,
  cashBalance: 1_250_000,
  inboxUnreadCount: 2,
  hasCloudSave: true,
});

if (report.status !== "ready") {
  throw new Error(`Expected ready multiplayer report, got ${report.status}`);
}

if (!report.joinCode.startsWith("FML-")) {
  throw new Error("Join code should start with FML-");
}

if (report.leaderboard.length < 3) {
  throw new Error("Expected demo leaderboard with at least three managers");
}

if (report.databaseTables.length !== 3) {
  throw new Error("Expected three multiplayer database tables");
}

const blocked = buildMultiplayerLeagueReport({
  appVersion: "3.6.0",
  authenticated: false,
  supabaseConfigured: false,
  realDatabaseReadyScore: 20,
  clubName: "Local FC",
  seasonNumber: 1,
  currentRound: 1,
  maxRound: 14,
  points: 0,
  position: 8,
  jobSecurity: 50,
  cashBalance: 500_000,
  inboxUnreadCount: 0,
  hasCloudSave: false,
});

if (blocked.status !== "blocked" || blocked.blockers.length < 2) {
  throw new Error("Expected blocked report without auth and Supabase config");
}

console.log("Multiplayer League test OK", report.joinCode, report.readinessScore);
