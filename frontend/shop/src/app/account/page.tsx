"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthSession } from "@/shared/hooks/use-auth-session";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/client";
import { getStoredTheme, setTheme, ThemeName } from "@/shared/lib/theme";
import type { UserPreference } from "@/shared/types";

const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

const profileSchema = z.object({
  fullName: z.string().min(2),
  telegramUsername: z.string().min(2),
});

const preferencesSchema = z.object({
  theme: z.enum(["light", "dark"]),
});

const mockOrders = [
  { id: 4201, date: "2025-05-01", status: "Подтвержден", amount: "45 990 ₽" },
  { id: 4202, date: "2025-04-14", status: "Доставлен", amount: "89 400 ₽" },
  { id: 4203, date: "2025-03-30", status: "Отменён", amount: "19 200 ₽" },
];

export default function AccountPage() {
  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "Иван Иванов",
      telegramUsername: "@ivan",
    },
  });

  const preferencesForm = useForm<z.infer<typeof preferencesSchema>>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      theme: "light",
    },
  });

  const { isAuthenticated, logout, userId } = useAuthSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [prefMessage, setPrefMessage] = useState<string | null>(null);
  const [prefError, setPrefError] = useState<string | null>(null);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetTokenExpired, setResetTokenExpired] = useState(false);
  const [isResetRequesting, setIsResetRequesting] = useState(false);
  const [isResetCompleting, setIsResetCompleting] = useState(false);

  const userQuery = useQuery({
    queryKey: ["userProfile", userId],
    queryFn: async () => {
      if (!userId) {
        throw new Error("Нет идентификатора пользователя");
      }
      return apiClient.getUser(userId);
    },
    enabled: Boolean(isAuthenticated && userId),
  });

  const botDeepLink = useMemo(() => {
    if (!BOT_USERNAME || !userQuery.data?.login) {
      return null;
    }
    return `https://t.me/${BOT_USERNAME}?start=${encodeURIComponent(userQuery.data.login)}`;
  }, [userQuery.data?.login]);

  useEffect(() => {
    if (userQuery.data) {
      profileForm.reset({
        fullName: userQuery.data.fullName ?? "",
        telegramUsername: userQuery.data.telegramUsername ? `@${userQuery.data.telegramUsername}` : "",
      });
    }
  }, [userQuery.data, profileForm]);

  const preferenceQuery = useQuery({
    queryKey: ["userPreference", userId],
    queryFn: async () => {
      if (!userId) {
        return null;
      }
      try {
        return await apiClient.getUserPreference(userId);
      } catch (error) {
        if (error instanceof Error && error.message.includes("404")) {
          return null;
        }
        throw error;
      }
    },
    enabled: Boolean(isAuthenticated && userId),
  });

  useEffect(() => {
    if (preferenceQuery.data?.theme) {
      preferencesForm.reset({ theme: preferenceQuery.data.theme as "light" | "dark" });
      setTheme(preferenceQuery.data.theme as "light" | "dark");
    }
  }, [preferenceQuery.data?.theme, preferencesForm]);

  const preferenceMutation = useMutation<UserPreference, Error, ThemeName, { previousTheme: ThemeName }>({
    mutationFn: (theme: ThemeName) => {
      if (!userId) {
        return Promise.reject(new Error("Не удалось определить пользователя"));
      }
      return apiClient.upsertUserPreference({ userId, theme });
    },
    onMutate: async (theme) => {
      const previousTheme =
        (preferenceQuery.data?.theme as ThemeName | undefined) ?? getStoredTheme();
      setTheme(theme);
      return { previousTheme };
    },
    onError: (error, _variables, context) => {
      if (context?.previousTheme) {
        setTheme(context.previousTheme);
      }
      setPrefMessage(null);
      setPrefError(
        error instanceof Error ? error.message : "Не удалось сохранить тему"
      );
    },
    onSuccess: (data) => {
      setTheme(data.theme as "light" | "dark");
      queryClient.setQueryData(["userPreference", userId], data);
      setPrefMessage("Тема успешно сохранена");
      setPrefError(null);
    },
  });

  const handlePreferencesSubmit = preferencesForm.handleSubmit(async (values) => {
    if (!userId) {
      setPrefError("Необходимо войти в систему");
      return;
    }
    setPrefMessage(null);
    setPrefError(null);
    preferenceMutation.mutate(values.theme);
  });

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const profileMutation = useMutation({
    mutationFn: (values: z.infer<typeof profileSchema>) => {
      if (!userQuery.data || !userId) {
        return Promise.reject(new Error("Не удалось загрузить данные пользователя"));
      }
      return apiClient.updateUser(userId, {
        id: userId,
        login: userQuery.data.login,
        telegramUsername: normalizeTelegramTag(values.telegramUsername),
        roleId: userQuery.data.roleId,
        fullName: values.fullName,
        isArchived: userQuery.data.isArchived,
      });
    },
    onSuccess: () => {
      setProfileMessage("Профиль обновлён");
      setProfileError(null);
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ["userProfile", userId] });
      }
    },
    onError: (error) => {
      setProfileMessage(null);
      setProfileError(error instanceof Error ? error.message : "Не удалось обновить профиль");
    },
  });

  const handleProfileSubmit = profileForm.handleSubmit((values) => {
    if (!isAuthenticated || !userId) {
      setProfileError("Необходимо войти в систему");
      return;
    }
    setProfileMessage(null);
    setProfileError(null);
    profileMutation.mutate(values);
  });

  const handleRequestPasswordReset = async () => {
    setResetMessage(null);
    setResetError(null);
    const login = userQuery.data?.login;

    if (!login) {
      setResetError("Не удалось определить логин");
      return;
    }

    try {
      setIsResetRequesting(true);
      const { token, sent } = await apiClient.requestPasswordReset({
        loginOrTelegram: login,
      });
      setResetToken(token);
      setResetMessage(
        sent
          ? "Токен отправлен в Telegram. Если сообщение не пришло, используйте токен ниже вручную."
          : "Chat ID не найден. Скопируйте токен ниже и завершите сброс на сайте."
      );
    } catch (error) {
      setResetError(error instanceof Error ? error.message : "Не удалось выпустить токен");
    } finally {
      setIsResetRequesting(false);
    }
  };

  const handleCompletePasswordReset = async () => {
    setResetMessage(null);
    setResetError(null);
    setResetTokenExpired(false);
    if (!resetToken.trim() || !newPassword.trim()) {
      setResetError("Введите токен и новый пароль");
      return;
    }

    try {
      setIsResetCompleting(true);
      await apiClient.completePasswordReset({
        token: resetToken.trim(),
        newPassword: newPassword.trim(),
      });
      setResetMessage("Пароль обновлён. Войдите с новым паролем.");
      setNewPassword("");
      setResetToken("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не удалось сбросить пароль";
      setResetError(message);
      if (message.toLowerCase().includes("истёк")) {
        setResetTokenExpired(true);
      }
    } finally {
      setIsResetCompleting(false);
    }
  };

  const isProfileDisabled = useMemo(
    () => !isAuthenticated || !userId || userQuery.isFetching || profileMutation.isPending,
    [isAuthenticated, userId, userQuery.isFetching, profileMutation.isPending]
  );

  return (
    <div className="container space-y-8 px-4 py-8 mx-auto">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
            Личный кабинет
          </p>
          <h1 className="text-3xl font-semibold">Ваши данные и предпочтения</h1>
        </div>
        {isAuthenticated && (
          <Button variant="outline" onClick={handleLogout}>
            Выйти из аккаунта
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Профиль</CardTitle>
            <CardDescription>Редактируйте персональные данные</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...profileForm}>
              <form className="space-y-4" onSubmit={handleProfileSubmit}>
                <FormField
                  control={profileForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ФИО</FormLabel>
                      <FormControl>
                        <Input placeholder="Иван Иванов" disabled={isProfileDisabled} {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="telegramUsername"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Тег Telegram</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="@username"
                          disabled={isProfileDisabled}
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                {profileMessage && (
                  <p className="text-sm text-emerald-600">{profileMessage}</p>
                )}
                {profileError && <p className="text-sm text-destructive">{profileError}</p>}
                <Button type="submit" disabled={isProfileDisabled}>
                  {profileMutation.isPending ? "Сохраняем..." : "Сохранить"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Тема интерфейса</CardTitle>
            <CardDescription>Настройки сохраняются в `user_preferences`</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...preferencesForm}>
              <form className="space-y-4" onSubmit={handlePreferencesSubmit}>
                <FormField
                  control={preferencesForm.control}
                  name="theme"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Тема</FormLabel>
                      <select
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                        disabled={!isAuthenticated || !userId || preferenceMutation.isPending}
                        {...field}
                      >
                        <option value="light">Светлая</option>
                        <option value="dark">Тёмная</option>
                      </select>
                    </FormItem>
                  )}
                />
                {prefMessage && (
                  <p className="text-sm text-emerald-600">{prefMessage}</p>
                )}
                {prefError && (
                  <p className="text-sm text-destructive">{prefError}</p>
                )}
                <Button
                  type="submit"
                  disabled={!isAuthenticated || !userId || preferenceMutation.isPending}
                >
                  {preferenceMutation.isPending ? "Сохраняем..." : "Сохранить"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

    <Card>
      <CardHeader>
        <CardTitle>Сброс пароля через Telegram</CardTitle>
        <CardDescription>
          Генерируем токен в базе и отправляем его через бота, если chat ID уже известен. Токен можно ввести вручную ниже.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <p className="text-sm font-semibold">1. Запросить токен</p>
            <p className="text-xs text-muted-foreground">
              Мы используем ваш текущий логин и отправляем токен в Telegram. Если сообщение не пришло, используйте токен вручную.
            </p>
            {botDeepLink && (
              <Button variant="outline" asChild>
                <a href={botDeepLink} target="_blank" rel="noreferrer">
                  Открыть Telegram-бота
                </a>
              </Button>
            )}
            <Button
              variant="secondary"
              disabled={!isAuthenticated || isResetRequesting}
              onClick={handleRequestPasswordReset}
            >
              {isResetRequesting ? "Генерируем..." : "Отправить токен в Telegram"}
            </Button>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-semibold">2. Установить новый пароль</p>
            <Input
              value={resetToken}
              onChange={(event) => setResetToken(event.target.value)}
              placeholder="Токен из Telegram"
              disabled={!isAuthenticated}
            />
            <Input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="Новый пароль"
              disabled={!isAuthenticated}
            />
            <Button
              onClick={handleCompletePasswordReset}
              disabled={!isAuthenticated || isResetCompleting}
            >
              {isResetCompleting ? "Обновляем..." : "Сбросить пароль"}
            </Button>
          </div>
        </div>
        {resetMessage && <p className="text-xs text-emerald-600 break-words">{resetMessage}</p>}
        {resetToken && (
          <p className="text-[11px] text-muted-foreground font-mono break-all">
            {resetToken}
          </p>
        )}
        {resetError && (
          <p className="text-xs text-destructive">
            {resetError}
            {resetTokenExpired && <span className="block">Запросите новый токен и повторите попытку.</span>}
          </p>
        )}
      </CardContent>
    </Card>

    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>История заказов</CardTitle>
          <CardDescription>Данные из view `v_user_orders_summary`</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Сумма</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>#{order.id}</TableCell>
                    <TableCell>{order.date}</TableCell>
                    <TableCell>{order.status}</TableCell>
                    <TableCell>{order.amount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function normalizeTelegramTag(tag: string) {
  if (!tag) return "";
  const trimmed = tag.trim();
  return trimmed.startsWith("@") ? trimmed.slice(1) : trimmed;
}
