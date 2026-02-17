'use client';

import { AdminLayout } from '@/widgets/admin-layout/ui/admin-layout';
import { ProductsTable } from '@/entities/product/ui/products-table';
import { Button } from '@/shared/ui/button';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { ProductForm } from '@/features/product/manage/ui/product-form';

export default function ProductsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <AdminLayout allowedRoles={['admin']}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Товары</h1>
            <p className="text-muted-foreground">
              Управление каталогом товаров
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="w-full md:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Добавить товар
          </Button>
        </div>

        <ProductsTable />

        <ProductForm
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />
      </div>
    </AdminLayout>
  );
}
