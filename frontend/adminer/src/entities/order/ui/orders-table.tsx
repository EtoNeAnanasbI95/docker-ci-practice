'use client';

import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Input } from '@/shared/ui/input';
import { useOrders, useUpdateOrder } from '@/entities/order/model/hooks';
import { useOrderStatuses } from '@/entities/order-status/model/hooks';
import { usePaymentStatuses } from '@/entities/payment-status/model/hooks';
import { useAdminRole } from '@/shared/hooks/use-admin-role';
import type { OrderSummary, OrderStatus, PaymentStatus } from '@/shared/types';

export function OrdersTable() {
  const { data: orders, isLoading, error } = useOrders();
  const { data: orderStatuses } = useOrderStatuses();
  const { data: paymentStatuses } = usePaymentStatuses();
  const { role } = useAdminRole();
  const canManage = role === 'admin' || role === 'manager';
  const [filter, setFilter] = useState('');

  const filteredOrders = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return orders ?? [];
    return (orders ?? []).filter((order) => {
      const haystack = `${order.id} ${formatCustomer(order)} ${order.orderStatus ?? ''} ${order.paymentStatus ?? ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [orders, filter]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Заказы</CardTitle>
          <CardDescription>Загрузка заказов...</CardDescription>
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
          <CardTitle>Заказы</CardTitle>
          <CardDescription>Ошибка загрузки заказов</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-destructive">
            Не удалось загрузить заказы
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
      <Card>
        <CardHeader>
            <CardTitle>Заказы</CardTitle>
            <CardDescription>
              Список всех заказов в вашем магазине
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 overflow-x-auto">
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <Input
              placeholder="Фильтр по ID, клиенту или статусам"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="md:max-w-sm"
            />
          </div>
          <Table>
          <TableHeader>
            <TableRow>
                <TableHead>ID заказа</TableHead>
                <TableHead>Клиент</TableHead>
                <TableHead>Дата заказа</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Оплата</TableHead>
                <TableHead>Итого</TableHead>
                {canManage && <TableHead className="text-right">Действия</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">#{order.id}</TableCell>
                <TableCell>{formatCustomer(order)}</TableCell>
                <TableCell>
                  {format(new Date(order.orderDate), 'MMM dd, yyyy')}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {order.orderStatus || 'Unknown'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {order.paymentStatus || 'Unknown'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {(order.totalAmount ?? 0).toLocaleString('ru-RU', {
                    style: 'currency',
                    currency: 'RUB',
                  })}
                </TableCell>
                {canManage && (
                  <TableCell className="text-right">
                    <OrderManagerDialog
                      order={order}
                      orderStatuses={orderStatuses ?? []}
                      paymentStatuses={paymentStatuses ?? []}
                    />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

type DialogProps = {
  order: OrderSummary;
  orderStatuses: OrderStatus[];
  paymentStatuses: PaymentStatus[];
};

function OrderManagerDialog({ order, orderStatuses, paymentStatuses }: DialogProps) {
  const [open, setOpen] = useState(false);
  const [orderStatusId, setOrderStatusId] = useState(order.orderStatusId);
  const [paymentStatusId, setPaymentStatusId] = useState(order.paymentStatusId);
  const [deliveryDate, setDeliveryDate] = useState(toDatetimeLocal(order.deliveredOrder?.deliveryDate));
  const [courierName, setCourierName] = useState(order.deliveredOrder?.courierName ?? '');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [deliveryMessage, setDeliveryMessage] = useState<string | null>(null);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);

  const updateOrderStatuses = useUpdateOrder();
  const updateOrderDelivery = useUpdateOrder();

  useEffect(() => {
    setOrderStatusId(order.orderStatusId);
    setPaymentStatusId(order.paymentStatusId);
    setDeliveryDate(toDatetimeLocal(order.deliveredOrder?.deliveryDate));
    setCourierName(order.deliveredOrder?.courierName ?? '');
    setStatusMessage(null);
    setStatusError(null);
    setDeliveryMessage(null);
    setDeliveryError(null);
  }, [order]);

  const handleSaveStatuses = async () => {
    setStatusMessage(null);
    setStatusError(null);
    try {
      await updateOrderStatuses.mutateAsync({
        id: order.id,
        data: {
          id: order.id,
          orderStatusId,
          paymentStatusId,
        },
      });
      setStatusMessage('Статусы обновлены');
    } catch (err) {
      setStatusError(
        err instanceof Error ? err.message : 'Не удалось обновить статусы'
      );
    }
  };

  const handleSaveDelivery = async () => {
    setDeliveryMessage(null);
    setDeliveryError(null);

    if (!deliveryDate || !courierName.trim()) {
      setDeliveryError('Укажите дату доставки и имя курьера');
      return;
    }

    const isoDate = toIsoString(deliveryDate);
    if (!isoDate) {
      setDeliveryError('Некорректная дата доставки');
      return;
    }

    try {
      await updateOrderDelivery.mutateAsync({
        id: order.id,
        data: {
          id: order.id,
          orderStatusId,
          paymentStatusId,
          deliveryDate: isoDate,
          courierName: courierName.trim(),
        },
      });

      setDeliveryMessage('Информация о доставке сохранена');
    } catch (err) {
      setDeliveryError(
        err instanceof Error ? err.message : 'Не удалось сохранить доставку'
      );
    }
  };

  const isStatusDisabled =
    !orderStatuses.length || !paymentStatuses.length || updateOrderStatuses.isPending;
  const isDeliverySaving = updateOrderDelivery.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Управлять
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Заказ #{order.id}</DialogTitle>
          <DialogDescription>
            Обновите статусы заказа или добавьте информацию о доставке.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <section className="space-y-3">
            <p className="text-sm font-semibold">Статусы заказа</p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor={`order-status-${order.id}`}>
                  Статус заказа
                </label>
                <Select
                  value={orderStatusId ? String(orderStatusId) : undefined}
                  onValueChange={(value) => setOrderStatusId(Number(value))}
                  disabled={isStatusDisabled}
                >
                  <SelectTrigger id={`order-status-${order.id}`}>
                    <SelectValue placeholder="Выберите статус" />
                  </SelectTrigger>
                  <SelectContent>
                    {orderStatuses.map((status) => (
                      <SelectItem key={status.id} value={String(status.id)}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor={`payment-status-${order.id}`}>
                  Статус оплаты
                </label>
                <Select
                  value={paymentStatusId ? String(paymentStatusId) : undefined}
                  onValueChange={(value) => setPaymentStatusId(Number(value))}
                  disabled={isStatusDisabled}
                >
                  <SelectTrigger id={`payment-status-${order.id}`}>
                    <SelectValue placeholder="Выберите статус" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentStatuses.map((status) => (
                      <SelectItem key={status.id} value={String(status.id)}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {statusMessage && (
              <p className="text-sm text-emerald-600">{statusMessage}</p>
            )}
            {statusError && (
              <p className="text-sm text-destructive">{statusError}</p>
            )}
            <Button onClick={handleSaveStatuses} disabled={isStatusDisabled}>
              {updateOrderStatuses.isPending ? 'Сохраняем...' : 'Сохранить статусы'}
            </Button>
          </section>

          <section className="space-y-3">
            <p className="text-sm font-semibold">Доставка</p>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor={`delivery-date-${order.id}`}>
                  Дата и время доставки
                </label>
                <Input
                  id={`delivery-date-${order.id}`}
                  type="datetime-local"
                  value={deliveryDate}
                  onChange={(event) => setDeliveryDate(event.target.value)}
                  disabled={isDeliverySaving}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor={`courier-${order.id}`}>
                  Имя курьера
                </label>
                <Input
                  id={`courier-${order.id}`}
                  value={courierName}
                  onChange={(event) => setCourierName(event.target.value)}
                  placeholder="Иван Иванов"
                  disabled={isDeliverySaving}
                />
              </div>
            </div>
            {deliveryMessage && (
              <p className="text-sm text-emerald-600">{deliveryMessage}</p>
            )}
            {deliveryError && (
              <p className="text-sm text-destructive">{deliveryError}</p>
            )}
            <DialogFooter>
              <Button
                variant="secondary"
                onClick={handleSaveDelivery}
                disabled={isDeliverySaving}
              >
                {isDeliverySaving ? 'Сохраняем...' : 'Сохранить доставку'}
              </Button>
            </DialogFooter>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function formatCustomer(order: OrderSummary) {
  return (
    order.customerName?.trim() ||
    order.customerLogin ||
    (order.customerTelegram ? `@${order.customerTelegram}` : null) ||
    `Пользователь #${order.userId}`
  );
}

function toDatetimeLocal(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function toIsoString(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}
