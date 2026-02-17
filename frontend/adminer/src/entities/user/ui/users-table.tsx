'use client';

import { useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Edit, Trash2 } from 'lucide-react';
import { useUsers, useDeleteUser } from '@/entities/user/model/hooks';
import { User } from '@/shared/types';
import { format } from 'date-fns';
import { UserForm } from '@/features/user/manage/ui/user-form';
import { Input } from '@/shared/ui/input';

export function UsersTable() {
  const { data: users, isLoading, error } = useUsers();
  const deleteUser = useDeleteUser();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [filter, setFilter] = useState('');

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      try {
        await deleteUser.mutateAsync(id);
      } catch (error) {
        console.error('Failed to delete user:', error);
      }
    }
  };

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return users ?? [];
    return (users ?? []).filter((u) => {
      const haystack = `${u.login} ${u.telegramUsername ?? ''} ${u.role?.name ?? ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [users, filter]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Пользователи</CardTitle>
          <CardDescription>Загрузка пользователей...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Загрузка...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Пользователи</CardTitle>
          <CardDescription>Ошибка загрузки пользователей</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-destructive">
            Не удалось загрузить пользователей
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Пользователи</CardTitle>
          <CardDescription>
            Список всех пользователей в вашей системе
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 overflow-x-auto">
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <Input
              placeholder="Фильтр по логину, роли или Telegram"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="md:max-w-sm"
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Логин</TableHead>
                <TableHead>Telegram</TableHead>
                <TableHead>Роль</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Создан</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.login}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span>@{user.telegramUsername || 'n/a'}</span>
                        <Badge variant={user.telegramVerified ? 'default' : 'secondary'}>
                          {user.telegramVerified ? 'Подтвержден' : 'Не подтвержден'}
                        </Badge>
                      </div>
                      {user.telegramChatId && (
                        <p className="text-xs text-muted-foreground">chat #{user.telegramChatId}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {user.role?.name || 'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.isDeleted
                          ? 'destructive'
                          : user.isArchived
                            ? 'secondary'
                            : 'default'
                      }
                    >
                      {user.isDeleted
                        ? 'Удален'
                        : user.isArchived
                          ? 'Архив'
                          : 'Активен'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.creationDatetime
                      ? format(new Date(user.creationDatetime), 'MMM dd, yyyy')
                      : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(user.id)}
                        disabled={deleteUser.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <UserForm
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        user={editingUser}
        onSuccess={() => {
          setIsEditDialogOpen(false);
          setEditingUser(null);
        }}
      />
    </>
  );
}
