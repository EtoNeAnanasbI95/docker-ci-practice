"use client";

import { useEffect, useState } from "react";
import { getAdminRole } from "@/shared/lib/admin-auth";

export type AdminRole = "admin" | "manager" | string | null;

export function useAdminRole() {
  const [role, setRole] = useState<AdminRole>(() => {
    if (typeof window === "undefined") {
      return null;
    }
    const stored = getAdminRole();
    return stored ? stored.toLowerCase() : null;
  });
  const [ready, setReady] = useState<boolean>(typeof window !== "undefined");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncRole = () => {
      const stored = getAdminRole();
      setRole(stored ? stored.toLowerCase() : null);
    };

    syncRole();
    setReady(true);

    window.addEventListener("storage", syncRole);
    return () => {
      window.removeEventListener("storage", syncRole);
    };
  }, []);

  return {
    role,
    isLoading: !ready,
  };
}
