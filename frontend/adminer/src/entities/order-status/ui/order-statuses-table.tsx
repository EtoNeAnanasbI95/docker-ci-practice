'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Edit, Trash2 } from 'lucide-react';
import { useOrderStatuses, useDeleteOrderStatus } from '@/entities/order-status/model/hooks';
import { OrderStatus } from '@/shared/types';
import { OrderStatusForm } from '@/features/order-status/manage/ui/order-status-form';
import { format } from 'date-fns';

export function OrderStatusesTable() {
  const { data: orderStatuses, isLoading, error } = useOrderStatuses();
  const deleteOrderStatus = useDeleteOrderStatus();
  const [editingOrderStatus, setEditingOrderStatus] = useState<OrderStatus | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleEdit = (orderStatus: OrderStatus) => {
    setEditingOrderStatus(orderStatus);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Вы уверены, что хотите удалить этот статус заказа?')) {
      try {
        await deleteOrderStatus.mutateAsync(id);
      } catch (error) {
        console.error('Failed to delete order status:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Статусы заказов</CardTitle>
          <CardDescription>Загрузка статусов заказов...</CardDescription>
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
          <CardTitle>Статусы заказов</CardTitle>
          <CardDescription>Ошибка загрузки статусов заказов</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-destructive">
            Не удалось загрузить статусы заказов
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Статусы заказов</CardTitle>
          <CardDescription>
            Список всех статусов заказов в вашей системе
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Создан</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderStatuses?.map((orderStatus) => (
                <TableRow key={orderStatus.id}>
                  <TableCell className="font-medium">{orderStatus.name}</TableCell>
                  <TableCell>
                    {format(new Date(orderStatus.createdAt), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(orderStatus)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(orderStatus.id)}
                        disabled={deleteOrderStatus.isPending}
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

      <OrderStatusForm
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        orderStatus={editingOrderStatus}
        onSuccess={() => {
          setIsEditDialogOpen(false);
          setEditingOrderStatus(null);
        }}
      />
    </>
  );
}
