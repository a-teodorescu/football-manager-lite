import { generateFixtures } from "../engine/fixtureGenerator";
import { createMockLeagueTeams, defaultUserTactic } from "../engine/leagueSimulation";
import { createInitialStandings } from "../engine/standings";
import type { Fixture } from "../engine/fixtureGenerator";
import type { StandingRow } from "../engine/standings";
import type { Tactic, Team } from "../engine/types";
import type { ClubProfile, ManagerSavePayload } from "./saveService";

export const SAVE_SCHEMA_VERSION = 46;

const DEFAULT_MANAGER_ID = "anonymous";
const DEFAULT_CLUB_PROFILE: ClubProfile = {
  name: "FC Bucuresti",
  city: "Bucuresti",
  primaryColor: "#2563eb",
  secondaryColor: "#f8fafc",
};

export interface SaveMigrationReport {
  originalVersion: number | "unknown";
  targetVersion: number;
  changed: boolean;
  warnings: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function readString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function readNumber(value: unknown, fallback: number, min = 0): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(min, Math.floor(value))
    : fallback;
}

function readArray<T>(value: unknown, fallback: T[] = []): T[] {
  return Array.isArray(value) ? (value as T[]) : fallback;
}

function readTactic(value: unknown): Tactic {
  if (!isRecord(value)) return defaultUserTactic;

  const formation = ["4-4-2", "4-3-3", "4-2-3-1", "5-3-2"].includes(
    String(value.formation),
  )
    ? (value.formation as Tactic["formation"])
    : defaultUserTactic.formation;
  const mentality = ["defensive", "balanced", "attacking"].includes(
    String(value.mentality),
  )
    ? (value.mentality as Tactic["mentality"])
    : defaultUserTactic.mentality;
  const pressing = ["low", "medium", "high"].includes(String(value.pressing))
    ? (value.pressing as Tactic["pressing"])
    : defaultUserTactic.pressing;

  const tempo = ["slow", "normal", "fast"].includes(String(value.tempo))
    ? (value.tempo as Tactic["tempo"])
    : "normal";
  const width = ["narrow", "balanced", "wide"].includes(String(value.width))
    ? (value.width as Tactic["width"])
    : "balanced";
  const risk = ["safe", "balanced", "risky"].includes(String(value.risk))
    ? (value.risk as Tactic["risk"])
    : "balanced";
  const defensiveLine = ["deep", "standard", "high"].includes(String(value.defensiveLine))
    ? (value.defensiveLine as Tactic["defensiveLine"])
    : "standard";
  const attackingFocus = ["balanced", "left", "right", "central"].includes(String(value.attackingFocus))
    ? (value.attackingFocus as Tactic["attackingFocus"])
    : "balanced";

  return { formation, mentality, pressing, tempo, width, risk, defensiveLine, attackingFocus };
}

function readClubProfile(value: unknown, teams: Team[]): ClubProfile {
  const savedUserTeamName = teams.find((team) => team.id === "team-user")?.name;
  const raw = isRecord(value) ? value : {};

  return {
    name: readString(raw.name, savedUserTeamName || DEFAULT_CLUB_PROFILE.name).slice(0, 40),
    city: readString(raw.city, DEFAULT_CLUB_PROFILE.city).slice(0, 40),
    primaryColor: readString(raw.primaryColor, DEFAULT_CLUB_PROFILE.primaryColor),
    secondaryColor: readString(raw.secondaryColor, DEFAULT_CLUB_PROFILE.secondaryColor),
  };
}

function readIsoDate(value: unknown): string {
  if (typeof value === "string" && !Number.isNaN(Date.parse(value))) return value;
  return new Date().toISOString();
}

export function inspectSaveMigration(rawPayload: unknown): SaveMigrationReport {
  const source = isRecord(rawPayload) ? rawPayload : {};
  const originalVersion =
    typeof source.version === "number" && Number.isFinite(source.version)
      ? Math.floor(source.version)
      : "unknown";
  const migrated = migrateSavePayload(rawPayload, DEFAULT_MANAGER_ID);
  const warnings: string[] = [];

  if (!Array.isArray(source.teams) || migrated.teams.length === 0) {
    warnings.push("Teams were missing or invalid and were rebuilt from mock league data.");
  }
  if (!Array.isArray(source.fixtures) || migrated.fixtures.length === 0) {
    warnings.push("Fixtures were missing or invalid and were regenerated.");
  }
  if (!Array.isArray(source.standings) || migrated.standings.length === 0) {
    warnings.push("Standings were missing or invalid and were rebuilt.");
  }

  return {
    originalVersion,
    targetVersion: SAVE_SCHEMA_VERSION,
    changed: originalVersion !== SAVE_SCHEMA_VERSION,
    warnings,
  };
}

export function migrateSavePayload(
  rawPayload: unknown,
  managerId: string = DEFAULT_MANAGER_ID,
): ManagerSavePayload {
  const source = isRecord(rawPayload) ? rawPayload : {};
  const fallbackTeams = createMockLeagueTeams();
  const teams = readArray<Team>(source.teams, fallbackTeams).length
    ? readArray<Team>(source.teams, fallbackTeams)
    : fallbackTeams;
  const seasonNumber = readNumber(source.seasonNumber, 1, 1);
  const currentRound = readNumber(source.currentRound, 1, 1);
  const clubProfile = readClubProfile(source.clubProfile, teams);
  const fixtures = readArray<Fixture>(source.fixtures, generateFixtures(teams));
  const standings = readArray<StandingRow>(
    source.standings,
    createInitialStandings(teams),
  );

  return {
    ...(source as Partial<ManagerSavePayload>),
    version: SAVE_SCHEMA_VERSION,
    managerId: readString(source.managerId, managerId),
    seasonNumber,
    currentRound,
    userTactic: readTactic(source.userTactic),
    clubProfile,
    trainingFocus: ["balanced", "attacking", "defensive", "fitness"].includes(
      String(source.trainingFocus),
    )
      ? (source.trainingFocus as ManagerSavePayload["trainingFocus"])
      : "balanced",
    trainingHistory: readArray(source.trainingHistory),
    statusHistory: readArray(source.statusHistory),
    transferHistory: readArray(source.transferHistory),
    scoutingReports: readArray(source.scoutingReports),
    scoutingHistory: readArray(source.scoutingHistory),
    financeHistory: readArray(source.financeHistory),
    youthAcademyHistory: readArray(source.youthAcademyHistory),
    seasonHistory: readArray(source.seasonHistory),
    contractHistory: readArray(source.contractHistory),
    cupHistory: readArray(source.cupHistory),
    europeanHistory: readArray(source.europeanHistory),
    inboxMessages: readArray(source.inboxMessages),
    sponsorshipHistory: readArray(source.sponsorshipHistory),
    facilityHistory: readArray(source.facilityHistory),
    notificationHistory: readArray(source.notificationHistory),
    teams,
    fixtures,
    results: readArray(source.results),
    standings,
    selectedFixtureId:
      typeof source.selectedFixtureId === "string" ? source.selectedFixtureId : undefined,
    updatedAt: readIsoDate(source.updatedAt),
  } as ManagerSavePayload;
}
