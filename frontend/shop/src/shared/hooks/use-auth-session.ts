"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AUTH_CHANGE_EVENT,
  clearAuthSession,
  getStoredAccessToken,
  getStoredRole,
  getStoredUserId,
} from "@/shared/lib/auth-client";

type AuthSessionState = {
  isAuthenticated: boolean;
  role: string | null;
  userId: number | null;
};

const defaultState: AuthSessionState = {
  isAuthenticated: false,
  role: null,
  userId: null,
};

function readAuthState(): AuthSessionState {
  if (typeof window === "undefined") {
    return defaultState;
  }

  const token = getStoredAccessToken();
  const role = getStoredRole();
  const userId = getStoredUserId();

  return {
    isAuthenticated: Boolean(token),
    role,
    userId,
  };
}

export function useAuthSession() {
  const [state, setState] = useState<AuthSessionState>(defaultState);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleChange = () => setState(readAuthState());
    handleChange();
    window.addEventListener("storage", handleChange);
    window.addEventListener(AUTH_CHANGE_EVENT, handleChange);

    return () => {
      window.removeEventListener("storage", handleChange);
      window.removeEventListener(AUTH_CHANGE_EVENT, handleChange);
    };
  }, []);

  const logout = useCallback(() => {
    clearAuthSession();
    setState(readAuthState());
  }, []);

  return { ...state, logout };
}
