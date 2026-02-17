'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { useCreateUser, useUpdateUser } from '@/entities/user/model/hooks';
import { useRoles } from '@/entities/role/model/hooks';
import { User, CreateUserData, UpdateUserData } from '@/shared/types';

const userSchema = z.object({
  login: z.string().min(1, 'Логин обязателен'),
  telegramUsername: z.string().min(2, 'Укажите тег Telegram'),
  telegramChatId: z.string().optional(),
  roleId: z.number().min(1, 'Роль обязательна'),
  fullName: z.string().min(2, 'ФИО обязательно'),
  isArchived: z.boolean().default(false),
  password: z
    .string()
    .optional()
    .refine(
      (value) => !value || value.length >= 6,
      'Пароль должен содержать минимум 6 символов'
    ),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
  onSuccess?: () => void;
}

export function UserForm({ open, onOpenChange, user, onSuccess }: UserFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const { data: roles } = useRoles();

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      login: '',
      telegramUsername: '',
      telegramChatId: '',
      password: '',
      roleId: 0,
      fullName: '',
      isArchived: false,
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        login: user.login,
        telegramUsername: user.telegramUsername ? `@${user.telegramUsername}` : '',
        telegramChatId: user.telegramChatId ? String(user.telegramChatId) : '',
        password: '',
        roleId: user.roleId,
        fullName: user.fullName || '',
        isArchived: user.isArchived,
      });
    } else {
      form.reset({
        login: '',
        telegramUsername: '',
        telegramChatId: '',
        password: '',
        roleId: 0,
        fullName: '',
        isArchived: false,
      });
    }
  }, [user, form]);

  const onSubmit = async (data: UserFormData) => {
    setIsSubmitting(true);
    try {
      if (!user && !data.password) {
        form.setError('password', {
          type: 'manual',
          message: 'Пароль обязателен для нового пользователя',
        });
        setIsSubmitting(false);
        return;
      }

      if (user) {
        const updateData: UpdateUserData = {
          id: user.id,
          login: data.login,
          telegramUsername: normalizeTelegramTag(data.telegramUsername),
          telegramChatId: data.telegramChatId ? Number(data.telegramChatId) : undefined,
          roleId: data.roleId,
          fullName: data.fullName.trim(),
          isArchived: data.isArchived ?? false,
        };
        await updateUser.mutateAsync({ id: user.id, data: updateData });
      } else {
        const createData: CreateUserData = {
          login: data.login,
          telegramUsername: normalizeTelegramTag(data.telegramUsername),
          telegramChatId: data.telegramChatId ? Number(data.telegramChatId) : undefined,
          password: data.password!,
          roleId: data.roleId,
          fullName: data.fullName.trim(),
        };
        await createUser.mutateAsync(createData);
      }
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {user ? 'Редактировать пользователя' : 'Создать пользователя'}
          </DialogTitle>
          <DialogDescription>
            {user
              ? 'Обновите информацию о пользователе ниже.'
              : 'Добавьте нового пользователя в систему.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="login"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Логин</FormLabel>
                  <FormControl>
                    <Input placeholder="Логин" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telegramUsername"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Тег Telegram</FormLabel>
                  <FormControl>
                    <Input placeholder="@username" {...field} />
                  </FormControl>
                  <FormMessage />
                  <FormDescription>Будет использоваться для подтверждения аккаунта.</FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telegramChatId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chat ID (опционально)</FormLabel>
                  <FormControl>
                    <Input placeholder="Например, 123456789" {...field} />
                  </FormControl>
                  <FormDescription>Нужен для автоматической рассылки кодов.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!user && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Пароль</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Пароль"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="roleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Роль</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите роль" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles?.map((role) => (
                        <SelectItem key={role.id} value={role.id.toString()}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Полное имя</FormLabel>
                  <FormControl>
                    <Input placeholder="ФИО" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {user && (
              <FormField
                control={form.control}
                name="isArchived"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Архивировать пользователя</FormLabel>
                      <FormDescription>
                        Архивированные пользователи сохраняются в системе, но не могут входить в неё.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-primary"
                        checked={field.value ?? false}
                        onChange={(event) => field.onChange(event.target.checked)}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Сохранение...' : user ? 'Обновить' : 'Создать'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function normalizeTelegramTag(tag: string) {
  if (!tag) {
    return '';
  }
  const trimmed = tag.trim();
  return trimmed.startsWith('@') ? trimmed.slice(1) : trimmed;
}
