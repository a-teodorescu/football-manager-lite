import { buildRealDatabaseModeReport } from "./realDatabaseMode";
import { buildRealDatabaseSnapshot } from "../lib/realDatabaseService";
import { migrateSavePayload, SAVE_SCHEMA_VERSION } from "../lib/saveMigration";
import { createMockLeagueTeams, defaultUserTactic } from "./leagueSimulation";
import { generateFixtures } from "./fixtureGenerator";
import { createInitialStandings } from "./standings";

const teams = createMockLeagueTeams();
const payload = migrateSavePayload(
  {
    version: SAVE_SCHEMA_VERSION,
    managerId: "00000000-0000-4000-8000-000000000001",
    seasonNumber: 1,
    currentRound: 1,
    userTactic: defaultUserTactic,
    clubProfile: { name: "QA FC", city: "Bucuresti", primaryColor: "#111827", secondaryColor: "#f8fafc" },
    teams,
    fixtures: generateFixtures(teams),
    results: [],
    standings: createInitialStandings(teams),
    updatedAt: new Date().toISOString(),
  },
  "00000000-0000-4000-8000-000000000001",
);

const snapshot = buildRealDatabaseSnapshot(payload);
const report = buildRealDatabaseModeReport({
  appVersion: "3.5.0",
  authenticated: true,
  supabaseConfigured: true,
  userId: payload.managerId,
  saveSchemaVersion: SAVE_SCHEMA_VERSION,
  payloadVersion: payload.version,
  teamsCount: payload.teams.length,
  playersCount: payload.teams[0]?.players.length ?? 0,
  fixturesCount: payload.fixtures.length,
  resultsCount: payload.results.length,
  financeReportsCount: payload.financeHistory?.length ?? 0,
  inboxMessagesCount: payload.inboxMessages?.length ?? 0,
  normalizedTables: snapshot.tables,
});

if (snapshot.manager_profiles.length !== 1) throw new Error("Expected one manager profile row.");
if (snapshot.club_players.length === 0) throw new Error("Expected player mirror rows.");
if (snapshot.league_fixtures.length === 0) throw new Error("Expected fixture mirror rows.");
if (report.tableCount !== 6) throw new Error("Expected six real database mirror tables.");
if (report.status === "blocked") throw new Error("Authenticated configured report should not be blocked.");

const blocked = buildRealDatabaseModeReport({
  appVersion: "3.5.0",
  authenticated: false,
  supabaseConfigured: false,
  saveSchemaVersion: SAVE_SCHEMA_VERSION,
  payloadVersion: SAVE_SCHEMA_VERSION,
  teamsCount: 0,
  playersCount: 0,
  fixturesCount: 0,
  resultsCount: 0,
  financeReportsCount: 0,
  inboxMessagesCount: 0,
});

if (blocked.status !== "blocked") throw new Error("Unauthenticated unconfigured report should be blocked.");

console.log(`Real Database Mode OK: ${snapshot.totalRows} projected rows, readiness ${report.readinessScore}/100.`);
