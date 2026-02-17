'use client';

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import Link from "next/link";
import { handleAuthSuccess, readAuthTokens } from "@/shared/lib/auth-client";
import { apiClient } from "@/shared/api/client";

const loginSchema = z.object({
  login: z.string().min(3, "Введите корректный логин"),
  password: z.string().min(6, "Минимум 6 символов"),
});

const SSO_URL = process.env.NEXT_PUBLIC_SSO_URL ?? "http://localhost:8081";
const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      login: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormData) => {
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${SSO_URL}/auth/logIn`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await readAuthTokens(response);

      const stayedOnShop = handleAuthSuccess(data, router.push);
      if (stayedOnShop) {
        setSuccess("Добро пожаловать! Вы можете продолжить покупки.");
      }
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Не удалось войти. Проверьте логин и пароль."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container min-h-[calc(100vh-8rem)] px-4 py-10 mx-auto flex items-center justify-center">
      <div className="grid w-full max-w-5xl gap-6 md:grid-cols-2">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Войти в аккаунт</CardTitle>
            <CardDescription>
              Один вход для магазина и админ-панели. Мы определим, куда вас направить.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="login"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Логин</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          autoComplete="username"
                          placeholder="username"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Пароль</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {error && <p className="text-sm text-destructive">{error}</p>}
                {success && <p className="text-sm text-emerald-600">{success}</p>}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Входим..." : "Продолжить"}
                </Button>
              </form>
            </Form>
            <p className="text-xs text-muted-foreground">
              После входа мы проверим вашу роль в SSO. Админы и менеджеры автоматически
              попадут в Adminer, остальные останутся в магазине.
            </p>
            <p className="text-xs text-muted-foreground">
              Нет аккаунта?{" "}
              <Link href="/register" className="underline">
                Зарегистрируйтесь
              </Link>
            </p>
          </CardContent>
        </Card>
        <PasswordResetPanel />
      </div>
    </div>
  );
}

function PasswordResetPanel() {
  const [loginOrTelegram, setLoginOrTelegram] = useState("");
  const [requestMessage, setRequestMessage] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [completeMessage, setCompleteMessage] = useState<string | null>(null);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [tokenExpired, setTokenExpired] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const botDeepLink = BOT_USERNAME ? `https://t.me/${BOT_USERNAME}` : null;

  const handleRequest = async (event: FormEvent) => {
    event.preventDefault();

    setRequestMessage(null);
    setRequestError(null);
    setGeneratedToken(null);
    setTokenExpired(false);
    setCompleteMessage(null);
    setCompleteError(null);

    if (!loginOrTelegram.trim()) {
      setRequestError("Укажите логин или тег Telegram");
      return;
    }

    try {
      setIsRequesting(true);
      const { token, sent } = await apiClient.requestPasswordReset({
        loginOrTelegram: loginOrTelegram.trim(),
      });
      setGeneratedToken(token);
      setResetToken(token);
      setRequestMessage(
        sent
          ? "Токен сброса отправлен в Telegram. Если сообщение не пришло, скопируйте токен вручную."
          : "Чат Telegram не найден. Скопируйте токен ниже и используйте его вместе с новым паролем."
      );
    } catch (error) {
      setRequestError(
        error instanceof Error ? error.message : "Не удалось выпустить токен"
      );
    } finally {
      setIsRequesting(false);
    }
  };

  const handleComplete = async (event: FormEvent) => {
    event.preventDefault();
    setCompleteMessage(null);
    setCompleteError(null);
    setTokenExpired(false);

    if (!resetToken.trim() || !newPassword.trim()) {
      setCompleteError("Введите токен и новый пароль");
      return;
    }

    try {
      setIsCompleting(true);
      await apiClient.completePasswordReset({
        token: resetToken.trim(),
        newPassword: newPassword.trim(),
      });
      setCompleteMessage("Пароль обновлён. Теперь войдите с новым паролем.");
      setResetToken("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Не удалось сбросить пароль";
      setCompleteError(message);
      if (message.toLowerCase().includes("истёк")) {
        setTokenExpired(true);
      }
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Сброс пароля через Telegram</CardTitle>
        <CardDescription>
          Генерируем токен в базе и отправляем его в ваш Telegram, если chat ID уже известен боту.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold">1. Запросить токен</p>
          <form onSubmit={handleRequest} className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Логин или Telegram</label>
              <Input
                value={loginOrTelegram}
                onChange={(event) => setLoginOrTelegram(event.target.value)}
                placeholder="ivan или @telegram"
                autoComplete="off"
              />
            </div>
            {botDeepLink && (
              <Button asChild variant="outline" className="w-full">
                <a href={botDeepLink} target="_blank" rel="noreferrer">
                  Открыть Telegram-бота
                </a>
              </Button>
            )}
            {requestMessage && (
              <p className="text-sm text-emerald-600">
                {requestMessage}
                {generatedToken && (
                  <span className="font-mono text-xs break-all block mt-1">{generatedToken}</span>
                )}
              </p>
            )}
            {requestError && <p className="text-sm text-destructive">{requestError}</p>}
            <Button type="submit" className="w-full" variant="secondary" disabled={isRequesting}>
              {isRequesting ? "Генерируем..." : "Получить токен"}
            </Button>
          </form>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold">2. Установить новый пароль</p>
          <form onSubmit={handleComplete} className="space-y-3">
            <Input
              value={resetToken}
              onChange={(event) => setResetToken(event.target.value)}
              placeholder="Токен из Telegram"
              autoComplete="off"
            />
            <Input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="Новый пароль"
            />
            {completeMessage && <p className="text-sm text-emerald-600">{completeMessage}</p>}
            {completeError && (
              <p className="text-sm text-destructive">
                {completeError}
                {tokenExpired && <span className="block">Запросите новый токен и попробуйте снова.</span>}
              </p>
            )}
            <Button type="submit" className="w-full" variant="outline" disabled={isCompleting}>
              {isCompleting ? "Обновляем..." : "Сбросить пароль"}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
