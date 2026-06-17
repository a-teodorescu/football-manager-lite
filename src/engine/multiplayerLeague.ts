export type MultiplayerLeagueStatus = "blocked" | "partial" | "ready";
export type MultiplayerInviteRole = "owner" | "member";

export interface MultiplayerManagerCard {
  managerId: string;
  managerName: string;
  clubName: string;
  seasonNumber: number;
  points: number;
  position: number;
  jobSecurity: number;
  cashBalance: number;
  lastActiveRound: number;
}

export interface MultiplayerLeagueInvite {
  code: string;
  role: MultiplayerInviteRole;
  expiresInDays: number;
  shareText: string;
}

export interface MultiplayerLeagueReport {
  status: MultiplayerLeagueStatus;
  statusLabel: string;
  readinessScore: number;
  leagueCode: string;
  joinCode: string;
  invite: MultiplayerLeagueInvite;
  projectedManagers: number;
  leaderboard: MultiplayerManagerCard[];
  blockers: string[];
  warnings: string[];
  databaseTables: Array<{
    table: string;
    purpose: string;
    rows: number;
    rls: string;
  }>;
  recommendedActions: string[];
}

export interface BuildMultiplayerLeagueInput {
  appVersion: string;
  authenticated: boolean;
  supabaseConfigured: boolean;
  realDatabaseReadyScore: number;
  userId?: string;
  managerName?: string;
  clubName: string;
  seasonNumber: number;
  currentRound: number;
  maxRound: number;
  points: number;
  position: number;
  jobSecurity: number;
  cashBalance: number;
  inboxUnreadCount: number;
  hasCloudSave: boolean;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function hashString(input: string): number {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function buildLeagueCode(userId: string | undefined, clubName: string, seasonNumber: number): string {
  const seed = `${userId ?? "guest"}:${clubName}:${seasonNumber}`;
  const hash = hashString(seed).toString(36).toUpperCase().slice(0, 6).padEnd(6, "0");
  return `FML-${hash}`;
}

function buildLeaderboard(input: BuildMultiplayerLeagueInput): MultiplayerManagerCard[] {
  const userCard: MultiplayerManagerCard = {
    managerId: input.userId ?? "local-manager",
    managerName: input.managerName || "You",
    clubName: input.clubName,
    seasonNumber: input.seasonNumber,
    points: input.points,
    position: input.position,
    jobSecurity: input.jobSecurity,
    cashBalance: input.cashBalance,
    lastActiveRound: Math.min(input.currentRound, input.maxRound),
  };

  const rivals: MultiplayerManagerCard[] = [
    {
      managerId: "demo-rival-1",
      managerName: "Demo Rival",
      clubName: "North City FC",
      seasonNumber: input.seasonNumber,
      points: Math.max(0, input.points - 3),
      position: input.position + 1,
      jobSecurity: clamp(input.jobSecurity - 8, 1, 100),
      cashBalance: Math.max(0, input.cashBalance - 120_000),
      lastActiveRound: Math.max(1, input.currentRound - 1),
    },
    {
      managerId: "demo-rival-2",
      managerName: "Academy Builder",
      clubName: "South Academy",
      seasonNumber: input.seasonNumber,
      points: input.points + 2,
      position: Math.max(1, input.position - 1),
      jobSecurity: clamp(input.jobSecurity + 5, 1, 100),
      cashBalance: input.cashBalance + 80_000,
      lastActiveRound: input.currentRound,
    },
  ];

  return [userCard, ...rivals]
    .sort((a, b) => b.points - a.points || b.jobSecurity - a.jobSecurity || b.cashBalance - a.cashBalance)
    .map((manager, index) => ({ ...manager, position: index + 1 }));
}

export function buildMultiplayerLeagueReport(input: BuildMultiplayerLeagueInput): MultiplayerLeagueReport {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!input.authenticated || !input.userId) {
    blockers.push("Login is required before creating or joining a friends league.");
  }

  if (!input.supabaseConfigured) {
    blockers.push("Supabase env vars are required for shared league rooms and member rows.");
  }

  if (input.realDatabaseReadyScore < 60) {
    warnings.push("Real Database Mode is not fully ready yet. Keep JSON save fallback enabled while testing multiplayer.");
  }

  if (!input.hasCloudSave) {
    warnings.push("Cloud save was not confirmed in this session. Save to Supabase before inviting friends.");
  }

  if (input.inboxUnreadCount > 10) {
    warnings.push("Inbox has many unread messages. Ask testers to mark messages read before reporting multiplayer bugs.");
  }

  const leagueCode = buildLeagueCode(input.userId, input.clubName, input.seasonNumber);
  const joinCode = `${leagueCode}-${String(input.seasonNumber).padStart(2, "0")}`;
  const leaderboard = buildLeaderboard(input);

  const databaseTables = [
    {
      table: "friends_leagues",
      purpose: "League rooms created by an authenticated manager, with name, code and owner.",
      rows: input.authenticated ? 1 : 0,
      rls: "Owners can manage their league; members can read joined leagues.",
    },
    {
      table: "friends_league_members",
      purpose: "Membership rows that link managers to friends leagues.",
      rows: input.authenticated ? leaderboard.length : 0,
      rls: "Managers can read membership for leagues they belong to.",
    },
    {
      table: "friends_league_snapshots",
      purpose: "Per-manager season snapshots used for shared leaderboards and comparison.",
      rows: input.authenticated ? leaderboard.length : 0,
      rls: "Managers can write their own snapshot and read snapshots in joined leagues.",
    },
  ];

  const score = clamp(
    20 +
      (input.authenticated ? 20 : 0) +
      (input.supabaseConfigured ? 20 : 0) +
      (input.hasCloudSave ? 15 : 0) +
      Math.min(15, Math.round(input.realDatabaseReadyScore / 7)) +
      (input.maxRound > 0 ? 10 : 0),
    0,
    blockers.length > 0 ? 74 : 100,
  );

  const status: MultiplayerLeagueStatus = blockers.length > 0 ? "blocked" : warnings.length > 0 ? "partial" : "ready";

  return {
    status,
    statusLabel:
      status === "ready"
        ? "Friends League ready"
        : status === "partial"
          ? "Friends League needs live QA"
          : "Friends League blocked",
    readinessScore: score,
    leagueCode,
    joinCode,
    invite: {
      code: joinCode,
      role: "owner",
      expiresInDays: 7,
      shareText: `Join my Football Manager Lite friends league with code ${joinCode}.`,
    },
    projectedManagers: leaderboard.length,
    leaderboard,
    blockers,
    warnings,
    databaseTables,
    recommendedActions: [
      "Run supabase/schema.sql before testing multiplayer tables.",
      "Save JSON fallback and sync Real Database Mode before sharing the league code.",
      "Create one test account per friend, then compare snapshots in the Multiplayer tab.",
      "Use Admin export when a tester sees a wrong leaderboard position.",
    ],
  };
}
