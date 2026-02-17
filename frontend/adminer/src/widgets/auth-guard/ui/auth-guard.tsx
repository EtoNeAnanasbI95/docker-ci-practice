"use client";

import { PropsWithChildren, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ensureAdminSession,
  getAdminAccessToken,
} from "@/shared/lib/admin-auth";

export function AuthGuard({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginRoute = useMemo(() => pathname === "/login", [pathname]);
  const [allowed, setAllowed] = useState(isLoginRoute);

  useEffect(() => {
    if (isLoginRoute) {
      setAllowed(true);
      return;
    }

    let redirected = false;

    const sendToLogin = () => {
      if (redirected) {
        return;
      }
      redirected = true;
      const nextPath = window.location.pathname + window.location.search;
      const params = new URLSearchParams();
      if (nextPath && nextPath !== "/login") {
        params.set("next", nextPath);
      }
      const target = params.size > 0 ? `/login?${params.toString()}` : "/login";
      router.replace(target);
    };

    const ok = ensureAdminSession();
    if (!ok) {
      sendToLogin();
      return;
    }

    setAllowed(true);

    const handleStorage = () => {
      const token = getAdminAccessToken();
      if (!token) {
        sendToLogin();
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, [isLoginRoute, router]);

  if (!allowed) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        Проверяем токен доступа...
      </div>
    );
  }

  return <>{children}</>;
}
