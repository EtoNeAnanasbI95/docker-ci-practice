'use client';

import { AdminLayout } from '@/widgets/admin-layout/ui/admin-layout';
import { DeliveredOrdersTable } from '@/entities/delivered-order/ui/delivered-orders-table';

export default function DeliveredOrdersPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Доставленные заказы</h1>
            <p className="text-muted-foreground">
              Просмотр доставленных заказов и информации о курьерах
            </p>
        </div>

        <DeliveredOrdersTable />
      </div>
    </AdminLayout>
  );
}
