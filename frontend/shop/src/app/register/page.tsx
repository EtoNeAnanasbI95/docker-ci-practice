'use client';

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { handleAuthSuccess, readAuthTokens } from "@/shared/lib/auth-client";
import { apiClient } from "@/shared/api/client";

const registerSchema = z.object({
  fullName: z.string().min(2, "Введите полное имя"),
  login: z.string().min(3, "Логин должен содержать минимум 3 символа"),
  telegramTag: z.string().min(2, "Введите тег Telegram"),
  password: z.string().min(6, "Минимум 6 символов"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

const SSO_URL = process.env.NEXT_PUBLIC_SSO_URL ?? "http://localhost:8081";
const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [botLink, setBotLink] = useState<string | null>(null);
  const [pendingLogin, setPendingLogin] = useState<string | null>(null);
  const [pendingPassword, setPendingPassword] = useState<string | null>(null);
  const [registrationExpiresAt, setRegistrationExpiresAt] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isRequestingVerification, setIsRequestingVerification] = useState(false);
  const [isConfirmingRegistration, setIsConfirmingRegistration] = useState(false);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      login: "",
      telegramTag: "",
      password: "",
    },
  });

  const onSubmit = async (values: RegisterFormData) => {
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    setVerificationMessage(null);
    setVerificationError(null);

    try {
      const response = await apiClient.requestRegistration({
        login: values.login,
        password: values.password,
        fullName: values.fullName,
        telegramUsername: values.telegramTag.replace(/^@/, ""),
      });

      setRegistrationId(response.registrationId);
      setPendingLogin(values.login);
      setPendingPassword(values.password);
      setRegistrationExpiresAt(response.expiresAt);
      setSuccess("Шаг 1 выполнен. Напишите нашему Telegram-боту и подтвердите аккаунт.");
      setVerificationCode("");

      if (BOT_USERNAME) {
        setBotLink(`https://t.me/${BOT_USERNAME}?start=${response.registrationId}`);
      } else {
        setBotLink(null);
      }
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Не удалось зарегистрироваться. Попробуйте другой логин."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center gap-6 px-4 mx-auto">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Создать аккаунт</CardTitle>
          <CardDescription>
            Регистрация сразу создаёт доступ и для магазина, и для админ-панели.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Полное имя</FormLabel>
                    <FormControl>
                      <Input placeholder="Иван Иванов" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                name="telegramTag"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telegram</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        autoComplete="off"
                        placeholder="@username"
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
                {isLoading ? "Регистрируем..." : "Создать аккаунт"}
              </Button>
            </form>
          </Form>
          <p className="text-xs text-muted-foreground">
            Уже есть аккаунт?{" "}
            <Link href="/login" className="underline">
              Войдите
            </Link>
          </p>
        </CardContent>
      </Card>

      {registrationId && (
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Подтверждение Telegram</CardTitle>
            <CardDescription>
              Напишите нашему Telegram-боту, он определит chat ID и пришлёт код.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Если бот ещё не получил ваш chat ID, просто отправьте ему любое сообщение, затем нажмите кнопку ниже — код придёт в Telegram.
            </p>
            {botLink && (
              <Button asChild variant="outline">
                <a href={botLink} target="_blank" rel="noreferrer">
                  Открыть Telegram-бота
                </a>
              </Button>
            )}
            {!BOT_USERNAME && (
              <p className="text-xs text-muted-foreground">
                Администратор не настроил ссылку на бота. Найдите его вручную и отправьте сообщение.
              </p>
            )}
            {registrationExpiresAt && (
              <p className="text-xs text-muted-foreground">
                Код действует до {new Date(registrationExpiresAt).toLocaleTimeString("ru-RU")}
              </p>
            )}
            {verificationMessage && (
              <p className="text-sm text-emerald-600">{verificationMessage}</p>
            )}
            {verificationError && (
              <p className="text-sm text-destructive">{verificationError}</p>
            )}
            <div className="space-y-3">
              <Button
                variant="secondary"
                disabled={isRequestingVerification}
                onClick={handleResendVerificationCode}
              >
                {isRequestingVerification ? "Отправляем код..." : "Отправить код повторно"}
              </Button>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Код из Telegram
                </label>
                <Input
                  value={verificationCode}
                  onChange={(event) => setVerificationCode(event.target.value)}
                  placeholder="Введите 6 цифр"
                  autoComplete="one-time-code"
                />
              </div>
              <Button
                onClick={handleConfirmRegistration}
                disabled={isConfirmingRegistration}
              >
                {isConfirmingRegistration ? "Проверяем..." : "Подтвердить Telegram"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Уже есть аккаунт?</CardTitle>
          <CardDescription>Перейдите на страницу входа</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            У вас уже есть учётная запись? <Link href="/login" className="underline">Войдите</Link> и подтвердите Telegram в личном кабинете.
          </p>
        </CardContent>
      </Card>
    </div>
  );

  async function handleResendVerificationCode() {
    if (!registrationId) {
      setVerificationError("Регистрация не найдена");
      return;
    }

    try {
      setIsRequestingVerification(true);
      const response = await apiClient.resendRegistrationCode({ registrationId });
      setVerificationMessage("Новый код отправлен в Telegram.");
      setRegistrationExpiresAt(response.expiresAt);
      setVerificationError(null);
    } catch (err) {
      setVerificationMessage(null);
      setVerificationError(err instanceof Error ? err.message : "Не удалось отправить код");
    } finally {
      setIsRequestingVerification(false);
    }
  }

  async function handleConfirmRegistration() {
    if (!registrationId) {
      setVerificationError("Регистрация не найдена");
      return;
    }
    if (!verificationCode.trim()) {
      setVerificationError("Введите код подтверждения");
      return;
    }
    if (!pendingLogin || !pendingPassword) {
      setVerificationError("Не удалось определить учетные данные");
      return;
    }

    try {
      setIsConfirmingRegistration(true);
      await apiClient.confirmRegistration({
        registrationId,
        code: verificationCode.trim(),
      });

      await logInAfterConfirmation(pendingLogin, pendingPassword);
    } catch (err) {
      setVerificationError(err instanceof Error ? err.message : "Не удалось подтвердить код");
    } finally {
      setIsConfirmingRegistration(false);
    }
  }

  async function logInAfterConfirmation(login: string, password: string) {
    const response = await fetch(`${SSO_URL}/auth/logIn`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ login, password }),
    });

    if (!response.ok) {
      throw new Error("Не удалось войти после подтверждения. Попробуйте войти вручную.");
    }

    const data = await readAuthTokens(response);
    handleAuthSuccess(data, router.push);
  }
}
