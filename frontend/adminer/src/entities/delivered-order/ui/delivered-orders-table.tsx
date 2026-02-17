'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { useDeliveredOrders } from '@/entities/delivered-order/model/hooks';
import { format } from 'date-fns';

export function DeliveredOrdersTable() {
  const { data: deliveredOrders, isLoading, error } = useDeliveredOrders();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Доставленные заказы</CardTitle>
          <CardDescription>Загрузка доставленных заказов...</CardDescription>
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
          <CardTitle>Доставленные заказы</CardTitle>
          <CardDescription>Ошибка загрузки доставленных заказов</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-destructive">
            Не удалось загрузить доставленные заказы
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
      <Card>
        <CardHeader>
            <CardTitle>Доставленные заказы</CardTitle>
            <CardDescription>
              Список всех доставленных заказов
            </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
          <TableHeader>
            <TableRow>
                <TableHead>ID заказа</TableHead>
                <TableHead>Дата доставки</TableHead>
                <TableHead>Имя курьера</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deliveredOrders?.map((deliveredOrder) => (
              <TableRow key={deliveredOrder.orderId}>
                <TableCell className="font-medium">#{deliveredOrder.orderId}</TableCell>
                <TableCell>
                  {format(new Date(deliveredOrder.deliveryDate), 'MMM dd, yyyy HH:mm')}
                </TableCell>
                <TableCell>{deliveredOrder.courierName}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
