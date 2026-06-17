import type { ManagerSavePayload } from "./saveService";
import { estimatePlayerValue } from "../engine/transferMarket";
import { getPlayerWage } from "../engine/finance";

interface SyncTableMeta {
  table: string;
  rows: number;
}

export interface RealDatabaseSnapshot {
  manager_profiles: Array<Record<string, unknown>>;
  club_players: Array<Record<string, unknown>>;
  league_fixtures: Array<Record<string, unknown>>;
  league_results: Array<Record<string, unknown>>;
  finance_ledger: Array<Record<string, unknown>>;
  manager_inbox: Array<Record<string, unknown>>;
  tables: Record<string, number>;
  totalRows: number;
}

export interface RealDatabaseSyncResult {
  managerId: string;
  syncedAt: string;
  tables: SyncTableMeta[];
  totalRows: number;
}

function getSupabaseUrl(): string | undefined {
  return import.meta.env.VITE_SUPABASE_URL;
}

function getSupabaseAnonKey(): string | undefined {
  return import.meta.env.VITE_SUPABASE_ANON_KEY;
}

function getUserTeam(payload: ManagerSavePayload) {
  return payload.teams.find((team) => team.id === "team-1") ?? payload.teams[0];
}

function getResultId(payload: ManagerSavePayload, index: number): string {
  const result = payload.results[index];
  return result?.fixture.id ?? `result-${payload.seasonNumber}-${index + 1}`;
}

export function buildRealDatabaseSnapshot(payload: ManagerSavePayload): RealDatabaseSnapshot {
  const userTeam = getUserTeam(payload);
  const profile = payload.clubProfile;
  const now = new Date().toISOString();

  const snapshot: RealDatabaseSnapshot = {
    manager_profiles: [
      {
        manager_id: payload.managerId,
        club_name: profile?.name ?? userTeam?.name ?? "Unknown Club",
        city: profile?.city ?? userTeam?.city ?? null,
        season_number: payload.seasonNumber,
        current_round: payload.currentRound,
        save_schema_version: payload.version,
        payload_updated_at: payload.updatedAt,
        tactic: payload.userTactic,
        cash_balance: payload.finance?.cashBalance ?? null,
        transfer_budget: payload.transferBudget ?? null,
        updated_at: now,
      },
    ],
    club_players: (userTeam?.players ?? []).map((player) => ({
      manager_id: payload.managerId,
      player_id: player.id,
      name: player.name,
      position: player.position,
      age: player.age,
      overall: player.overall,
      potential: Math.max(player.overall, player.overall + Math.round((player.form ?? 50) / 25)),
      nationality: player.nationality ?? null,
      country_code: player.countryCode ?? null,
      preferred_foot: player.preferredFoot ?? null,
      personality: player.personality ?? null,
      role: player.role ?? null,
      marketability: player.marketability ?? null,
      contract_wage: getPlayerWage(player),
      fitness: player.fitness ?? 100,
      morale: player.morale,
      injured_rounds_remaining: player.injury?.roundsRemaining ?? 0,
      market_value: estimatePlayerValue(player),
      updated_at: now,
    })),
    league_fixtures: payload.fixtures.map((fixture) => ({
      manager_id: payload.managerId,
      fixture_id: fixture.id,
      season_number: payload.seasonNumber,
      round: fixture.round,
      home_team_id: fixture.homeTeam.id,
      home_team_name: fixture.homeTeam.name,
      away_team_id: fixture.awayTeam.id,
      away_team_name: fixture.awayTeam.name,
      played: fixture.played,
      updated_at: now,
    })),
    league_results: payload.results.map((item, index) => ({
      manager_id: payload.managerId,
      result_id: getResultId(payload, index),
      fixture_id: item.fixture.id,
      season_number: payload.seasonNumber,
      round: item.fixture.round,
      home_team_id: item.result.homeTeamId,
      away_team_id: item.result.awayTeamId,
      home_score: item.result.homeScore,
      away_score: item.result.awayScore,
      home_xg: item.result.stats.homeXg,
      away_xg: item.result.stats.awayXg,
      match_seed: item.result.seed,
      updated_at: now,
    })),
    finance_ledger: (payload.financeHistory ?? []).map((entry) => ({
      manager_id: payload.managerId,
      entry_id: entry.id,
      season_number: entry.seasonNumber,
      round: entry.round,
      sponsor_income: entry.sponsorIncome,
      matchday_income: entry.matchdayIncome,
      performance_bonus: entry.performanceBonus,
      wage_cost: entry.wageCost,
      net_change: entry.netChange,
      balance_after: entry.balanceAfter,
      summary: entry.summary,
      updated_at: now,
    })),
    manager_inbox: (payload.inboxMessages ?? []).map((message) => ({
      manager_id: payload.managerId,
      message_id: message.id,
      season_number: message.seasonNumber,
      round: message.round,
      category: message.category,
      tone: message.tone,
      title: message.title,
      body: message.body,
      source: message.source,
      target_tab: message.targetTab,
      created_at: message.createdAt,
      read: message.read,
      pinned: message.pinned ?? false,
      updated_at: now,
    })),
    tables: {},
    totalRows: 0,
  };

  snapshot.tables = {
    manager_profiles: snapshot.manager_profiles.length,
    club_players: snapshot.club_players.length,
    league_fixtures: snapshot.league_fixtures.length,
    league_results: snapshot.league_results.length,
    finance_ledger: snapshot.finance_ledger.length,
    manager_inbox: snapshot.manager_inbox.length,
  };
  snapshot.totalRows = Object.values(snapshot.tables).reduce((sum, rows) => sum + rows, 0);

  return snapshot;
}

async function requestSupabase(path: string, accessToken: string, init: RequestInit = {}): Promise<void> {
  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Netlify.");
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Supabase request failed for ${path}`);
  }
}

async function replaceTableRows(table: string, rows: Array<Record<string, unknown>>, managerId: string, accessToken: string): Promise<SyncTableMeta> {
  await requestSupabase(`${table}?manager_id=eq.${encodeURIComponent(managerId)}`, accessToken, {
    method: "DELETE",
  });

  if (rows.length > 0) {
    await requestSupabase(table, accessToken, {
      method: "POST",
      body: JSON.stringify(rows),
    });
  }

  return { table, rows: rows.length };
}

export async function syncRealDatabaseSnapshot(
  userId: string,
  accessToken: string,
  payload: ManagerSavePayload,
): Promise<RealDatabaseSyncResult> {
  const snapshot = buildRealDatabaseSnapshot({ ...payload, managerId: userId });
  const tables = await Promise.all([
    replaceTableRows("manager_profiles", snapshot.manager_profiles, userId, accessToken),
    replaceTableRows("club_players", snapshot.club_players, userId, accessToken),
    replaceTableRows("league_fixtures", snapshot.league_fixtures, userId, accessToken),
    replaceTableRows("league_results", snapshot.league_results, userId, accessToken),
    replaceTableRows("finance_ledger", snapshot.finance_ledger, userId, accessToken),
    replaceTableRows("manager_inbox", snapshot.manager_inbox, userId, accessToken),
  ]);

  return {
    managerId: userId,
    syncedAt: new Date().toISOString(),
    tables,
    totalRows: tables.reduce((sum, table) => sum + table.rows, 0),
  };
}
