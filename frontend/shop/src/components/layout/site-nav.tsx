"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { useAuthSession } from "@/shared/hooks/use-auth-session";
import { Menu, X } from "lucide-react";
import { cn } from "@/shared/lib/utils";

export function SiteNav() {
  const { isAuthenticated } = useAuthSession();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/catalog", label: "Каталог" },
    { href: "/favorites", label: "Избранное" },
    { href: "/cart", label: "Корзина" },
    { href: "/orders", label: "Заказы" },
    { href: "/account", label: "Личный кабинет" },
  ];

  return (
    <div className="relative">
      <nav className="hidden items-center gap-4 text-sm text-muted-foreground md:flex">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            {link.label}
          </Link>
        ))}
        {!isAuthenticated && (
          <Button asChild size="sm">
            <Link href="/login">Войти</Link>
          </Button>
        )}
      </nav>

      <div className="md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Открыть меню"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        {open && (
          <div className="absolute right-0 top-12 z-40 w-56 rounded-md border bg-background shadow-lg">
            <div className="flex flex-col divide-y">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn("px-4 py-2 text-sm hover:bg-muted")}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {!isAuthenticated && (
                <Button
                  variant="ghost"
                  className="justify-start rounded-none px-4 py-2 text-sm"
                  asChild
                  onClick={() => setOpen(false)}
                >
                  <Link href="/login">Войти</Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
