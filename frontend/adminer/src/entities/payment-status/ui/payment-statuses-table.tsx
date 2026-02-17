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
import { usePaymentStatuses, useDeletePaymentStatus } from '@/entities/payment-status/model/hooks';
import { PaymentStatus } from '@/shared/types';
import { PaymentStatusForm } from '@/features/payment-status/manage/ui/payment-status-form';
import { format } from 'date-fns';

export function PaymentStatusesTable() {
  const { data: paymentStatuses, isLoading, error } = usePaymentStatuses();
  const deletePaymentStatus = useDeletePaymentStatus();
  const [editingPaymentStatus, setEditingPaymentStatus] = useState<PaymentStatus | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleEdit = (paymentStatus: PaymentStatus) => {
    setEditingPaymentStatus(paymentStatus);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Вы уверены, что хотите удалить этот статус платежа?')) {
      try {
        await deletePaymentStatus.mutateAsync(id);
      } catch (error) {
        console.error('Failed to delete payment status:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Статусы платежей</CardTitle>
          <CardDescription>Загрузка статусов платежей...</CardDescription>
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
          <CardTitle>Статусы платежей</CardTitle>
          <CardDescription>Ошибка загрузки статусов платежей</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-destructive">
            Не удалось загрузить статусы платежей
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Статусы платежей</CardTitle>
          <CardDescription>
            Список всех статусов платежей в вашей системе
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
              {paymentStatuses?.map((paymentStatus) => (
                <TableRow key={paymentStatus.id}>
                  <TableCell className="font-medium">{paymentStatus.name}</TableCell>
                  <TableCell>
                    {format(new Date(paymentStatus.createdAt), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(paymentStatus)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(paymentStatus.id)}
                        disabled={deletePaymentStatus.isPending}
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

      <PaymentStatusForm
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        paymentStatus={editingPaymentStatus}
        onSuccess={() => {
          setIsEditDialogOpen(false);
          setEditingPaymentStatus(null);
        }}
      />
    </>
  );
}
