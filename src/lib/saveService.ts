import type { FixtureResult } from "../engine/leagueSimulation";
import type { Fixture } from "../engine/fixtureGenerator";
import type { StandingRow } from "../engine/standings";
import type { Tactic, Team } from "../engine/types";
import type { TrainingFocus, TrainingSessionResult } from "../engine/training";
import type { RoundStatusReport } from "../engine/playerStatus";
import type { TransferMarketPlayer, TransferRecord } from "../engine/transferMarket";
import type { ClubFinance, FinanceReport } from "../engine/finance";
import type { YouthAcademyRecord, YouthAcademyState } from "../engine/youthAcademy";
import type { SeasonHistoryRecord } from "../engine/seasonProgression";
import type { ContractRecord } from "../engine/contracts";
import type { ScoutReport, ScoutingRecord } from "../engine/scouting";
import type { CupRecord, CupState } from "../engine/cupCompetition";
import type { BoardState } from "../engine/boardObjectives";

export interface ClubProfile {
  name: string;
  city: string;
  primaryColor: string;
  secondaryColor: string;
}

export interface ManagerSavePayload {
  version: number;
  managerId: string;
  seasonNumber: number;
  currentRound: number;
  userTactic: Tactic;
  clubProfile?: ClubProfile;
  trainingFocus?: TrainingFocus;
  lastTrainingRoundKey?: string;
  trainingHistory?: TrainingSessionResult[];
  statusHistory?: RoundStatusReport[];
  transferBudget?: number;
  transferMarket?: TransferMarketPlayer[];
  transferHistory?: TransferRecord[];
  finance?: ClubFinance;
  financeHistory?: FinanceReport[];
  youthAcademy?: YouthAcademyState;
  youthAcademyHistory?: YouthAcademyRecord[];
  seasonHistory?: SeasonHistoryRecord[];
  contractHistory?: ContractRecord[];
  scoutingReports?: ScoutReport[];
  scoutingHistory?: ScoutingRecord[];
  cupState?: CupState;
  cupHistory?: CupRecord[];
  boardState?: BoardState;
  teams: Team[];
  fixtures: Fixture[];
  results: FixtureResult[];
  standings: StandingRow[];
  selectedFixtureId?: string;
  updatedAt: string;
}

const LOCAL_SAVE_KEY_PREFIX = "football-manager-lite-save-v1";

function getSupabaseUrl(): string | undefined {
  return import.meta.env.VITE_SUPABASE_URL;
}

function getSupabaseAnonKey(): string | undefined {
  return import.meta.env.VITE_SUPABASE_ANON_KEY;
}

function getLocalSaveKey(userId: string): string {
  return `${LOCAL_SAVE_KEY_PREFIX}:${userId}`;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}

export function saveToLocalStorage(userId: string, payload: ManagerSavePayload): void {
  localStorage.setItem(getLocalSaveKey(userId), JSON.stringify(payload));
}

export function loadFromLocalStorage(userId: string): ManagerSavePayload | null {
  const raw = localStorage.getItem(getLocalSaveKey(userId));
  if (!raw) return null;

  try {
    return JSON.parse(raw) as ManagerSavePayload;
  } catch {
    localStorage.removeItem(getLocalSaveKey(userId));
    return null;
  }
}

export function clearLocalStorageSave(userId: string): void {
  localStorage.removeItem(getLocalSaveKey(userId));
}

export async function saveToSupabase(userId: string, accessToken: string, payload: ManagerSavePayload): Promise<void> {
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
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({
        manager_id: userId,
        payload: {
          ...payload,
          managerId: userId,
        },
        updated_at: payload.updatedAt,
      }),
    }
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Could not save game to Supabase.");
  }
}

export async function loadFromSupabase(userId: string, accessToken: string): Promise<ManagerSavePayload | null> {
  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Netlify environment variables.");
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/manager_saves?manager_id=eq.${encodeURIComponent(userId)}&select=payload&limit=1`,
    {
      method: "GET",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Could not load game from Supabase.");
  }

  const rows = (await response.json()) as Array<{ payload: ManagerSavePayload }>;
  const payload = rows[0]?.payload ?? null;

  return payload ? { ...payload, managerId: userId } : null;
}

export async function deleteSupabaseSave(userId: string, accessToken: string): Promise<void> {
  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Netlify environment variables.");
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/manager_saves?manager_id=eq.${encodeURIComponent(userId)}`,
    {
      method: "DELETE",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${accessToken}`,
        Prefer: "return=minimal",
      },
    }
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Could not delete game save from Supabase.");
  }
}
