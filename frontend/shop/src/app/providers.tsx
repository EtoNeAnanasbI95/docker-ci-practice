'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useEffect, useLayoutEffect, useState } from 'react';
import { FavoritesProvider } from '@/shared/context/favorites-context';
import { CartProvider } from '@/shared/context/cart-context';
import { initializeTheme, setTheme } from '@/shared/lib/theme';
import { useAuthSession } from '@/shared/hooks/use-auth-session';
import { apiClient } from '@/shared/api/client';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ToastProvider } from '@/shared/ui/toast';
import { ErrorBoundaryWithToast } from '@/shared/ui/error-boundary';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  );

  return (
    <ToastProvider>
      <ErrorBoundaryWithToast>
        <QueryClientProvider client={queryClient}>
          <FavoritesProvider>
            <CartProvider>
              <ThemeInitializer />
              {children}
            </CartProvider>
          </FavoritesProvider>
          <ReactQueryDevtools initialIsOpen />
        </QueryClientProvider>
      </ErrorBoundaryWithToast>
    </ToastProvider>
  );
}

function ThemeInitializer() {
  const { isAuthenticated, userId } = useAuthSession();

  useLayoutEffect(() => {
    initializeTheme();
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const preference = await apiClient.getUserPreference(userId);
        if (cancelled || !preference?.theme) {
          return;
        }
        const theme = preference.theme === 'dark' ? 'dark' : 'light';
        setTheme(theme);
      } catch (error) {
        console.warn('Не удалось загрузить пользовательскую тему', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, userId]);

  return null;
}
