'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/shared/lib/utils';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Tag,
  FileText,
  Truck,
  CreditCard,
  BarChart3,
  Database,
  LogOut,
} from 'lucide-react';
import { useAdminRole } from '@/shared/hooks/use-admin-role';
import { Button } from '@/shared/ui/button';
import { clearAdminSession } from '@/shared/lib/admin-auth';
import { X } from 'lucide-react';

const adminNavigation = [
  { name: 'Панель управления', href: '/', icon: LayoutDashboard },
  { name: 'Товары', href: '/products', icon: Package },
  { name: 'Заказы', href: '/orders', icon: ShoppingCart },
  { name: 'Пользователи', href: '/users', icon: Users },
  { name: 'Бренды', href: '/brands', icon: Tag },
  { name: 'Материалы', href: '/materials', icon: FileText },
  { name: 'Статусы заказов', href: '/order-statuses', icon: BarChart3 },
  { name: 'Статусы платежей', href: '/payment-statuses', icon: CreditCard },
  { name: 'Доставленные заказы', href: '/delivered-orders', icon: Truck },
  { name: 'Аналитика', href: '/analytics', icon: BarChart3 },
  { name: 'Бэкапы БД', href: '/database-backup', icon: Database },
];

const managerNavigation = [
  { name: 'Панель управления', href: '/', icon: LayoutDashboard },
  { name: 'Заказы', href: '/orders', icon: ShoppingCart },
  { name: 'Доставленные заказы', href: '/delivered-orders', icon: Truck },
];

interface SidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
  className?: string;
}

export function Sidebar({ isMobile = false, onClose, className }: SidebarProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const { role } = useAdminRole();
  const roleSafe = role ?? 'admin';
  const navigation =
    roleSafe === 'manager' ? managerNavigation : adminNavigation;

  const handleLogout = () => {
    clearAdminSession();
    router.replace('/login');
  };

  const container = (
    <div
      className={cn(
        'flex h-full w-64 flex-col bg-sidebar border-r border-sidebar-border',
        className
      )}
    >
      <div className="flex h-16 items-center justify-between px-6 border-b border-sidebar-border">
        <h1 className="text-xl font-semibold text-sidebar-foreground">
          Админ панель
        </h1>
        {isMobile && onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
              onClick={() => {
                if (isMobile && onClose) {
                  onClose();
                }
              }}
            >
              <item.icon
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  isActive
                    ? 'text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground group-hover:text-sidebar-accent-foreground'
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border px-3 py-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          Выйти
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 md:hidden">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="relative h-full w-64">
          {container}
        </div>
      </div>
    );
  }

  return container;
}
