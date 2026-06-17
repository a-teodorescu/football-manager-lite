export type RealDatabaseModeStatus = "blocked" | "partial" | "ready";

export interface RealDatabaseTablePlan {
  table: string;
  label: string;
  rows: number;
  conflictTarget: string;
  purpose: string;
  status: "ready" | "empty" | "blocked";
}

export interface RealDatabaseModeReport {
  status: RealDatabaseModeStatus;
  statusLabel: string;
  readinessScore: number;
  tableCount: number;
  totalProjectedRows: number;
  blockers: string[];
  warnings: string[];
  tables: RealDatabaseTablePlan[];
  migrationSteps: string[];
  recommendedActions: string[];
  manifest: {
    appVersion: string;
    saveSchemaVersion: number;
    payloadVersion: number;
    mode: "json_save_with_real_db_mirror";
  };
}

export interface BuildRealDatabaseModeInput {
  appVersion: string;
  authenticated: boolean;
  supabaseConfigured: boolean;
  userId?: string;
  saveSchemaVersion: number;
  payloadVersion: number;
  teamsCount: number;
  playersCount: number;
  fixturesCount: number;
  resultsCount: number;
  financeReportsCount: number;
  inboxMessagesCount: number;
  normalizedTables?: Partial<Record<string, number>>;
}

const BASE_TABLES: Array<Omit<RealDatabaseTablePlan, "rows" | "status"> & { key: string }> = [
  {
    key: "manager_profiles",
    table: "manager_profiles",
    label: "Manager profile",
    conflictTarget: "manager_id",
    purpose: "One row per authenticated manager with club, season and high-level career state.",
  },
  {
    key: "club_players",
    table: "club_players",
    label: "Club players",
    conflictTarget: "manager_id,player_id",
    purpose: "Queryable first-team squad mirror with position, OVR, nationality, contract and medical status.",
  },
  {
    key: "league_fixtures",
    table: "league_fixtures",
    label: "League fixtures",
    conflictTarget: "manager_id,fixture_id",
    purpose: "Fixture list mirror for schedules, played flag and future calendar debugging.",
  },
  {
    key: "league_results",
    table: "league_results",
    label: "League results",
    conflictTarget: "manager_id,result_id",
    purpose: "Played match result mirror for stats, records and future public pages.",
  },
  {
    key: "finance_ledger",
    table: "finance_ledger",
    label: "Finance ledger",
    conflictTarget: "manager_id,entry_id",
    purpose: "Per-round finance report mirror for charts and historical financial analysis.",
  },
  {
    key: "manager_inbox",
    table: "manager_inbox",
    label: "Manager inbox",
    conflictTarget: "manager_id,message_id",
    purpose: "Inbox messages mirrored as rows so they can be searched, filtered and paginated later.",
  },
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function getRowsForTable(input: BuildRealDatabaseModeInput, key: string): number {
  if (typeof input.normalizedTables?.[key] === "number") {
    return Math.max(0, Math.floor(input.normalizedTables[key] ?? 0));
  }

  if (key === "manager_profiles") return input.authenticated ? 1 : 0;
  if (key === "club_players") return input.playersCount;
  if (key === "league_fixtures") return input.fixturesCount;
  if (key === "league_results") return input.resultsCount;
  if (key === "finance_ledger") return input.financeReportsCount;
  if (key === "manager_inbox") return input.inboxMessagesCount;
  return 0;
}

export function buildRealDatabaseModeReport(input: BuildRealDatabaseModeInput): RealDatabaseModeReport {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!input.authenticated || !input.userId) {
    blockers.push("Login is required before a real database mirror can write manager-owned rows.");
  }

  if (!input.supabaseConfigured) {
    blockers.push("Supabase env vars are missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Netlify.");
  }

  if (input.payloadVersion !== input.saveSchemaVersion) {
    warnings.push("Current payload will be migrated before sync because its version differs from SAVE_SCHEMA_VERSION.");
  }

  if (input.resultsCount === 0) {
    warnings.push("No league results yet. The results table will stay empty until at least one round is simulated.");
  }

  if (input.financeReportsCount === 0) {
    warnings.push("No finance ledger entries yet. Simulate a round to create the first finance row.");
  }

  const tables = BASE_TABLES.map((item) => {
    const rows = getRowsForTable(input, item.key);
    return {
      table: item.table,
      label: item.label,
      conflictTarget: item.conflictTarget,
      purpose: item.purpose,
      rows,
      status: blockers.length > 0 ? "blocked" : rows > 0 ? "ready" : "empty",
    } satisfies RealDatabaseTablePlan;
  });

  const totalProjectedRows = tables.reduce((sum, item) => sum + item.rows, 0);
  const tableCount = tables.length;
  const nonEmptyTables = tables.filter((item) => item.rows > 0).length;
  const score = clamp(
    25 +
      (input.authenticated ? 20 : 0) +
      (input.supabaseConfigured ? 20 : 0) +
      Math.round((nonEmptyTables / tableCount) * 25) +
      (input.payloadVersion === input.saveSchemaVersion ? 10 : 0),
    0,
    blockers.length > 0 ? 74 : 100,
  );

  const status: RealDatabaseModeStatus = blockers.length > 0 ? "blocked" : warnings.length > 0 ? "partial" : "ready";

  return {
    status,
    statusLabel:
      status === "ready"
        ? "Real DB mirror ready"
        : status === "partial"
          ? "Real DB mirror ready with warnings"
          : "Real DB mirror blocked",
    readinessScore: score,
    tableCount,
    totalProjectedRows,
    blockers,
    warnings,
    tables,
    migrationSteps: [
      "Run supabase/schema.sql in Supabase SQL Editor.",
      "Confirm RLS is enabled on manager_profiles, club_players, league_fixtures, league_results, finance_ledger and manager_inbox.",
      "Deploy to Netlify with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY configured.",
      "Use JSON save first, then enable real DB mirror sync for the authenticated manager.",
      "Keep manager_saves as the canonical fallback until the real table mirror is verified on live data.",
    ],
    recommendedActions:
      blockers.length > 0
        ? [
            "Login with Supabase Auth.",
            "Check Netlify environment variables.",
            "Run the v3.5 schema update before testing table sync.",
          ]
        : [
            "Simulate one round to populate results and finance ledger.",
            "Open QA Live and Admin after sync to compare JSON save versus real table mirror.",
            "Use manager_saves as rollback if a table sync fails.",
          ],
    manifest: {
      appVersion: input.appVersion,
      saveSchemaVersion: input.saveSchemaVersion,
      payloadVersion: input.payloadVersion,
      mode: "json_save_with_real_db_mirror",
    },
  };
}
