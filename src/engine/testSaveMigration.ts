import { migrateSavePayload, SAVE_SCHEMA_VERSION, inspectSaveMigration } from "../lib/saveMigration";
import { createMockLeagueTeams, defaultUserTactic } from "./leagueSimulation";
import { generateFixtures } from "./fixtureGenerator";
import { createInitialStandings } from "./standings";

const teams = createMockLeagueTeams();
const migrated = migrateSavePayload(
  {
    version: 1,
    managerId: "legacy-user",
    seasonNumber: 2,
    currentRound: 3,
    userTactic: defaultUserTactic,
    teams,
    fixtures: generateFixtures(teams),
    results: [],
    standings: createInitialStandings(teams),
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  "auth-user",
);

if (migrated.version !== SAVE_SCHEMA_VERSION) throw new Error("Save was not migrated to current schema.");
if (migrated.managerId !== "legacy-user") throw new Error("Manager id should be preserved when present.");
if (!migrated.clubProfile?.name) throw new Error("Club profile should be normalized.");
if (!migrated.teams.length || !migrated.fixtures.length || !migrated.standings.length) {
  throw new Error("Core save collections should be present after migration.");
}

const rebuilt = migrateSavePayload({ currentRound: -4 }, "fallback-user");
if (rebuilt.managerId !== "fallback-user") throw new Error("Fallback manager id missing.");
if (rebuilt.currentRound !== 1) throw new Error("Current round should be clamped to 1.");
if (!rebuilt.teams.length || !rebuilt.fixtures.length) throw new Error("Corrupt save should be rebuilt safely.");

const report = inspectSaveMigration({ version: 1 });
if (!report.changed || report.targetVersion !== SAVE_SCHEMA_VERSION) throw new Error("Migration report should detect old version.");

console.log("Save migration OK", SAVE_SCHEMA_VERSION, rebuilt.teams.length, rebuilt.fixtures.length);
