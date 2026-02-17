"use client";

const ACCESS_KEY = "adminer.accessToken";
const ROLE_KEY = "adminer.role";
const ADMIN_LOGIN_URL =
  process.env.NEXT_PUBLIC_ADMIN_LOGIN_URL ?? "/login";
const SSO_URL = process.env.NEXT_PUBLIC_SSO_URL ?? "http://localhost:8081";

export type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  details?: string;
  data?: T;
};

export type SsoAuthTokens = {
  access_token: string;
  refresh_token: string;
  role: string;
  user_id?: number | null;
};

export type AdminTokens = {
  accessToken: string;
  role?: string | null;
};

let refreshPromise: Promise<string | null> | null = null;

function isBrowser() {
  return typeof window !== "undefined";
}

async function requestSsoLogout() {
  if (!isBrowser()) return;
  try {
    await fetch(`${SSO_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch (error) {
    console.warn("Adminer SSO logout failed", error);
  }
}

export function persistAdminTokens(tokens: AdminTokens) {
  if (!isBrowser()) return;
  localStorage.setItem(ACCESS_KEY, tokens.accessToken);
  if (tokens.role) {
    localStorage.setItem(ROLE_KEY, tokens.role);
  }
}

export function clearAdminSession() {
  if (!isBrowser()) return;
  void requestSsoLogout();
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(ROLE_KEY);
}

export function getAdminAccessToken(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getAdminRole(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(ROLE_KEY);
}

export async function refreshAdminSession(): Promise<string | null> {
  if (!isBrowser()) return null;

  if (!refreshPromise) {
    refreshPromise = (async () => {
      const response = await fetch(`${SSO_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        clearAdminSession();
        throw new Error(`SSO refresh failed: ${response.status}`);
      }

      const payload = (await response.json()) as ApiEnvelope<SsoAuthTokens>;
      if (!payload.success || !payload.data) {
        clearAdminSession();
        const reason =
          payload.details || payload.message || "SSO refresh returned empty payload";
        throw new Error(reason);
      }

      persistAdminTokens({
        accessToken: payload.data.access_token,
        role: payload.data.role,
      });

      return payload.data.access_token;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export function ensureAdminSession(): boolean {
  if (!isBrowser()) return false;

  const params = new URLSearchParams(window.location.search);
  const accessToken = params.get("accessToken");
  const role = params.get("role");

  if (accessToken) {
    persistAdminTokens({
      accessToken,
      role,
    });
    params.delete("accessToken");
    params.delete("role");
    const base =
      window.location.origin + window.location.pathname + window.location.hash;
    const query = params.toString();
    window.history.replaceState({}, "", query ? `${base}?${query}` : base);
    return true;
  }

  return !!localStorage.getItem(ACCESS_KEY);
}

export function redirectToAdminLogin(nextPath?: string) {
  if (!isBrowser()) return;
  const params = new URLSearchParams();
  if (nextPath && nextPath !== "/login") {
    params.set("next", nextPath);
  }
  const target =
    params.size > 0 ? `${ADMIN_LOGIN_URL}?${params.toString()}` : ADMIN_LOGIN_URL;
  window.location.href = target;
}
