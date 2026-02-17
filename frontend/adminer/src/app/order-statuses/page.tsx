'use client';

import { AdminLayout } from '@/widgets/admin-layout/ui/admin-layout';
import { OrderStatusesTable } from '@/entities/order-status/ui/order-statuses-table';
import { Button } from '@/shared/ui/button';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { OrderStatusForm } from '@/features/order-status/manage/ui/order-status-form';

export default function OrderStatusesPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <AdminLayout allowedRoles={['admin']}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Статусы заказов</h1>
            <p className="text-muted-foreground">
              Управление статусами заказов
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="w-full md:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Добавить статус
          </Button>
        </div>

        <OrderStatusesTable />

        <OrderStatusForm
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />
      </div>
    </AdminLayout>
  );
}
