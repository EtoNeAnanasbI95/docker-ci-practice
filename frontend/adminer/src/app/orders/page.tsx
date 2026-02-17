'use client';

import { AdminLayout } from '@/widgets/admin-layout/ui/admin-layout';
import { OrdersTable } from '@/entities/order/ui/orders-table';

export default function OrdersPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Заказы</h1>
            <p className="text-muted-foreground">
              Управление заказами клиентов
            </p>
        </div>

        <OrdersTable />
      </div>
    </AdminLayout>
  );
}
