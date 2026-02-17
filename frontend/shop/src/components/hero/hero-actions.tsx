"use client";

import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { useAuthSession } from "@/shared/hooks/use-auth-session";

export function HeroActions() {
  const { isAuthenticated } = useAuthSession();

  return (
    <div className="flex flex-wrap gap-3">
      <Button size="lg" asChild>
        <Link href="/catalog">Смотреть каталог</Link>
      </Button>
      {!isAuthenticated && (
        <Button variant="outline" size="lg" asChild>
          <Link href="/login">Войти</Link>
        </Button>
      )}
    </div>
  );
}
