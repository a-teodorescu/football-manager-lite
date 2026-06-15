import type { FixtureResult } from "../engine/leagueSimulation";
import type { Fixture } from "../engine/fixtureGenerator";
import type { StandingRow } from "../engine/standings";
import type { Tactic, Team } from "../engine/types";

export interface ManagerSavePayload {
  version: number;
  managerId: string;
  seasonNumber: number;
  currentRound: number;
  userTactic: Tactic;
  teams: Team[];
  fixtures: Fixture[];
  results: FixtureResult[];
  standings: StandingRow[];
  selectedFixtureId?: string;
  updatedAt: string;
}

const LOCAL_SAVE_KEY = "football-manager-lite-save-v1";
const DEMO_MANAGER_ID = "local-demo-manager";

function getSupabaseUrl(): string | undefined {
  return import.meta.env.VITE_SUPABASE_URL;
}

function getSupabaseAnonKey(): string | undefined {
  return import.meta.env.VITE_SUPABASE_ANON_KEY;
}

export function getDemoManagerId(): string {
  return DEMO_MANAGER_ID;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}

export function saveToLocalStorage(payload: ManagerSavePayload): void {
  localStorage.setItem(LOCAL_SAVE_KEY, JSON.stringify(payload));
}

export function loadFromLocalStorage(): ManagerSavePayload | null {
  const raw = localStorage.getItem(LOCAL_SAVE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as ManagerSavePayload;
  } catch {
    localStorage.removeItem(LOCAL_SAVE_KEY);
    return null;
  }
}

export function clearLocalStorageSave(): void {
  localStorage.removeItem(LOCAL_SAVE_KEY);
}

export async function saveToSupabase(payload: ManagerSavePayload): Promise<void> {
  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Netlify environment variables.");
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/manager_saves?on_conflict=manager_id`,
    {
      method: "POST",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({
        manager_id: payload.managerId,
        payload,
        updated_at: payload.updatedAt,
      }),
    }
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Could not save game to Supabase.");
  }
}

export async function loadFromSupabase(managerId = DEMO_MANAGER_ID): Promise<ManagerSavePayload | null> {
  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Netlify environment variables.");
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/manager_saves?manager_id=eq.${encodeURIComponent(managerId)}&select=payload&limit=1`,
    {
      method: "GET",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    }
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Could not load game from Supabase.");
  }

  const rows = (await response.json()) as Array<{ payload: ManagerSavePayload }>;
  return rows[0]?.payload ?? null;
}
