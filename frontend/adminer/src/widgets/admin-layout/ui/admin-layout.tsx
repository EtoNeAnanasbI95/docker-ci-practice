'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/widgets/sidebar/ui/sidebar';
import { useAdminRole } from '@/shared/hooks/use-admin-role';
import { Button } from '@/shared/ui/button';
import { Menu } from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
  allowedRoles?: Array<'admin' | 'manager'>;
}

export function AdminLayout({
  children,
  allowedRoles = ['admin', 'manager'],
}: AdminLayoutProps) {
  const { role, isLoading } = useAdminRole();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const normalizedRole = role ?? 'unknown';
  const isAllowed =
    allowedRoles.length === 0 ||
    allowedRoles.includes(normalizedRole as 'admin' | 'manager');

  const content = !isLoading && !isAllowed ? (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center text-muted-foreground">
      <div>
        <p className="text-lg font-semibold text-foreground">
          Недостаточно прав
        </p>
        <p className="text-sm">
          У вас нет доступа к этому разделу. Обратитесь к администратору или перейдите в раздел заказов.
        </p>
      </div>
      <Button asChild variant="outline">
        <Link href="/orders">Перейти к заказам</Link>
      </Button>
    </div>
  ) : (
    children
  );

  return (
    <div className="flex h-screen bg-background">
      <Sidebar className="hidden md:flex" />
      {isSidebarOpen && (
        <Sidebar isMobile onClose={() => setIsSidebarOpen(false)} />
      )}
      <main className="flex-1 overflow-auto">
        <div className="p-4 md:p-6">
          <div className="mb-4 flex items-center justify-between md:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              className="inline-flex items-center gap-2"
            >
              <Menu className="h-4 w-4" />
              Меню
            </Button>
            <Link href="/" className="text-sm font-semibold">
              Админ панель
            </Link>
          </div>
          {isLoading ? (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              Загружаем данные роли...
            </div>
          ) : (
            content
          )}
        </div>
      </main>
    </div>
  );
}
