'use client';

import { AdminLayout } from '@/widgets/admin-layout/ui/admin-layout';
import { UsersTable } from '@/entities/user/ui/users-table';
import { Button } from '@/shared/ui/button';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { UserForm } from '@/features/user/manage/ui/user-form';

export default function UsersPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <AdminLayout allowedRoles={['admin']}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Пользователи</h1>
            <p className="text-muted-foreground">
              Управление учетными записями пользователей
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="w-full md:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Добавить пользователя
          </Button>
        </div>

        <UsersTable />

        <UserForm
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />
      </div>
    </AdminLayout>
  );
}
