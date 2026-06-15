export interface AuthUser {
  id: string;
  email?: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  user: AuthUser;
}

export interface AuthActionResult {
  session: AuthSession | null;
  message: string;
}

const AUTH_STORAGE_KEY = "football-manager-lite-auth-session-v1";

function getSupabaseUrl(): string | undefined {
  return import.meta.env.VITE_SUPABASE_URL;
}

function getSupabaseAnonKey(): string | undefined {
  return import.meta.env.VITE_SUPABASE_ANON_KEY;
}

function requireSupabaseConfig(): { supabaseUrl: string; supabaseAnonKey: string } {
  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Netlify environment variables.");
  }

  return { supabaseUrl, supabaseAnonKey };
}

function saveStoredSession(session: AuthSession): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function getStoredAuthSession(): AuthSession | null {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    const session = JSON.parse(raw) as AuthSession;
    if (!session.accessToken || !session.user?.id) {
      clearStoredAuthSession();
      return null;
    }

    return session;
  } catch {
    clearStoredAuthSession();
    return null;
  }
}

export function clearStoredAuthSession(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

function getErrorMessage(data: unknown, fallback: string): string {
  if (typeof data === "object" && data !== null) {
    const record = data as Record<string, unknown>;
    if (typeof record.error_description === "string") return record.error_description;
    if (typeof record.msg === "string") return record.msg;
    if (typeof record.message === "string") return record.message;
    if (typeof record.error === "string") return record.error;
  }

  return fallback;
}

function createSessionFromAuthResponse(data: unknown): AuthSession | null {
  if (typeof data !== "object" || data === null) return null;

  const record = data as Record<string, unknown>;
  const user = record.user as Record<string, unknown> | undefined;
  const accessToken = record.access_token;

  if (typeof accessToken !== "string" || !user || typeof user.id !== "string") {
    return null;
  }

  const expiresIn = typeof record.expires_in === "number" ? record.expires_in : undefined;
  const refreshToken = typeof record.refresh_token === "string" ? record.refresh_token : undefined;

  return {
    accessToken,
    refreshToken,
    expiresAt: expiresIn ? Date.now() + expiresIn * 1000 : undefined,
    user: {
      id: user.id,
      email: typeof user.email === "string" ? user.email : undefined,
    },
  };
}

export async function registerWithEmail(email: string, password: string): Promise<AuthActionResult> {
  const { supabaseUrl, supabaseAnonKey } = requireSupabaseConfig();

  const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
    method: "POST",
    headers: {
      apikey: supabaseAnonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Could not create account."));
  }

  const session = createSessionFromAuthResponse(data);
  if (session) {
    saveStoredSession(session);
    return { session, message: "Cont creat si autentificat." };
  }

  return {
    session: null,
    message: "Cont creat. Daca proiectul Supabase cere confirmare pe email, confirma contul si apoi intra cu login.",
  };
}

export async function loginWithEmail(email: string, password: string): Promise<AuthSession> {
  const { supabaseUrl, supabaseAnonKey } = requireSupabaseConfig();

  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: supabaseAnonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Could not log in."));
  }

  const session = createSessionFromAuthResponse(data);
  if (!session) {
    throw new Error("Login response did not include a valid Supabase session.");
  }

  saveStoredSession(session);
  return session;
}

export async function logoutFromSupabase(accessToken: string): Promise<void> {
  const { supabaseUrl, supabaseAnonKey } = requireSupabaseConfig();

  try {
    await fetch(`${supabaseUrl}/auth/v1/logout`, {
      method: "POST",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } finally {
    clearStoredAuthSession();
  }
}
