'use client';

import { AdminLayout } from '@/widgets/admin-layout/ui/admin-layout';
import { PaymentStatusesTable } from '@/entities/payment-status/ui/payment-statuses-table';
import { Button } from '@/shared/ui/button';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { PaymentStatusForm } from '@/features/payment-status/manage/ui/payment-status-form';

export default function PaymentStatusesPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <AdminLayout allowedRoles={['admin']}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Статусы платежей</h1>
            <p className="text-muted-foreground">
              Управление статусами платежей
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="w-full md:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Добавить статус
          </Button>
        </div>

        <PaymentStatusesTable />

        <PaymentStatusForm
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />
      </div>
    </AdminLayout>
  );
}
