"use client";

const SSO_URL = process.env.NEXT_PUBLIC_SSO_URL ?? "http://localhost:8081";
const ACCESS_TOKEN_KEY = "shop.accessToken";
const ROLE_KEY = "shop.role";
const USER_ID_KEY = "shop.userId";
export const AUTH_CHANGE_EVENT = "shop-auth-changed";

export type AuthTokens = {
  access_token: string;
  refresh_token: string;
  role: string;
  user_id?: number | null;
};

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  details?: string;
  data?: T;
};

let refreshPromise: Promise<string | null> | null = null;

function isBrowser() {
  return typeof window !== "undefined";
}

function emitAuthChange() {
  if (!isBrowser()) {
    return;
  }
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

async function requestSsoLogout() {
  if (!isBrowser()) {
    return;
  }

  try {
    await fetch(`${SSO_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch (error) {
    console.warn("SSO logout failed", error);
  }
}

export async function readAuthTokens(response: Response): Promise<AuthTokens> {
  const payload = (await response.json()) as ApiEnvelope<AuthTokens>;

  if (!payload.success || !payload.data) {
    const errorMessage =
      payload.details || payload.message || `SSO error ${response.status}`;
    throw new Error(errorMessage);
  }

  return payload.data;
}

export function getStoredAccessToken(): string | null {
  if (!isBrowser()) {
    return null;
  }
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getStoredRole(): string | null {
  if (!isBrowser()) {
    return null;
  }
  return localStorage.getItem(ROLE_KEY);
}

export function getStoredUserId(): number | null {
  if (!isBrowser()) {
    return null;
  }
  const raw = localStorage.getItem(USER_ID_KEY);
  if (!raw) {
    return null;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function clearAuthSession() {
  if (!isBrowser()) {
    return;
  }
  void requestSsoLogout();
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(USER_ID_KEY);
  emitAuthChange();
}

export function persistAuthSession(data: AuthTokens) {
  if (!isBrowser()) {
    return;
  }

  localStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
  localStorage.setItem(ROLE_KEY, data.role);

  if (data.user_id !== undefined && data.user_id !== null) {
    localStorage.setItem(USER_ID_KEY, data.user_id.toString());
  } else {
    localStorage.removeItem(USER_ID_KEY);
  }

  emitAuthChange();
}

export function handleAuthSuccess(
  data: AuthTokens,
  push: (path: string) => void,
  redirectPath: string | null = "/"
): boolean {
  persistAuthSession(data);

  if (redirectPath) {
    push(redirectPath);
    return false;
  }

  return true;
}

export async function refreshAuthSession(): Promise<string | null> {
  if (!isBrowser()) {
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = (async () => {
      const response = await fetch(`${SSO_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        clearAuthSession();
        throw new Error(`SSO refresh failed: ${response.status}`);
      }

      const data = await readAuthTokens(response);
      persistAuthSession(data);
      return data.access_token;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}
