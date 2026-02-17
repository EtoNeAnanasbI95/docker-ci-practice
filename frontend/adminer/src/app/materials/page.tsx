'use client';

import { AdminLayout } from '@/widgets/admin-layout/ui/admin-layout';
import { MaterialsTable } from '@/entities/material/ui/materials-table';
import { Button } from '@/shared/ui/button';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { MaterialForm } from '@/features/material/manage/ui/material-form';

export default function MaterialsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <AdminLayout allowedRoles={['admin']}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Материалы</h1>
            <p className="text-muted-foreground">
              Управление материалами товаров
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="w-full md:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Добавить материал
          </Button>
        </div>

        <MaterialsTable />

        <MaterialForm
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />
      </div>
    </AdminLayout>
  );
}
