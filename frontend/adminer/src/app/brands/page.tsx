'use client';

import { AdminLayout } from '@/widgets/admin-layout/ui/admin-layout';
import { BrandsTable } from '@/entities/brand/ui/brands-table';
import { Button } from '@/shared/ui/button';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { BrandForm } from '@/features/brand/manage/ui/brand-form';

export default function BrandsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <AdminLayout allowedRoles={['admin']}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Бренды</h1>
            <p className="text-muted-foreground">
              Управление брендами товаров
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="w-full md:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Добавить бренд
          </Button>
        </div>

        <BrandsTable />

        <BrandForm
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />
      </div>
    </AdminLayout>
  );
}
