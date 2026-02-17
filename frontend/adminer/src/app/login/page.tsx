'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import {
  ApiEnvelope,
  SsoAuthTokens,
  getAdminAccessToken,
  persistAdminTokens,
} from '@/shared/lib/admin-auth';

const SSO_URL = process.env.NEXT_PUBLIC_SSO_URL ?? 'http://localhost:8081';

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTarget = useMemo(() => {
    const candidate = searchParams.get('next');
    if (!candidate || !candidate.startsWith('/')) {
      return '/';
    }
    return candidate === '/login' ? '/' : candidate;
  }, [searchParams]);

  useEffect(() => {
    if (getAdminAccessToken()) {
      router.replace(redirectTarget);
    }
  }, [redirectTarget, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`${SSO_URL}/auth/logIn`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ login, password }),
      });

      if (!response.ok) {
        throw new Error(`Ошибка авторизации: ${response.status}`);
      }

      const payload = (await response.json()) as ApiEnvelope<SsoAuthTokens>;
      if (!payload.success || !payload.data) {
        const reason = payload.details || payload.message || 'Не удалось войти';
        throw new Error(reason);
      }

      persistAdminTokens({
        accessToken: payload.data.access_token,
        role: payload.data.role,
      });

      router.replace(redirectTarget);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось авторизоваться');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-semibold">Вход в админку</CardTitle>
          <CardDescription>
            Используйте учётные данные администратора или менеджера
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="admin-login">
                Логин
              </label>
              <Input
                id="admin-login"
                name="login"
                autoComplete="username"
                value={login}
                onChange={(event) => setLogin(event.target.value)}
                placeholder="admin@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="admin-password">
                Пароль
              </label>
              <Input
                id="admin-password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Входим...' : 'Войти'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

