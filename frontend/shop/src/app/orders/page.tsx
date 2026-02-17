"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { Button } from "@/shared/ui/button";
import { useAuthSession } from "@/shared/hooks/use-auth-session";
import { apiClient } from "@/shared/api/client";
import type { OrderSummary } from "@/shared/types";

export default function OrdersPage() {
  const { isAuthenticated, userId } = useAuthSession();

  const ordersQuery = useQuery({
    queryKey: ["orders", userId],
    queryFn: () => apiClient.getOrders(),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  const userOrders = useMemo(() => {
    if (!userId || !ordersQuery.data) return [];
    return ordersQuery.data.filter((order) => order.userId === userId);
  }, [ordersQuery.data, userId]);

  if (!isAuthenticated) {
    return (
      <div className="container space-y-6 px-4 py-10 mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Заказы</CardTitle>
            <CardDescription>Чтобы просматривать свои заказы, выполните вход.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/login">Войти</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isLoading = ordersQuery.isLoading;
  const error = ordersQuery.error as Error | null;

  return (
    <div className="container space-y-6 px-4 py-10 mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Заказы</p>
          <h1 className="text-3xl font-semibold">История заказов</h1>
        </div>
        <Button variant="ghost" asChild>
          <Link href="/cart">Перейти в корзину</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Текущие и завершённые заказы</CardTitle>
          <CardDescription>Статусы подтягиваются напрямую из API</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading && <p className="text-sm text-muted-foreground">Загружаем заказы...</p>}
          {error && (
            <p className="text-sm text-destructive">
              Не удалось загрузить заказы: {error.message}
            </p>
          )}
          {!isLoading && !error && userOrders.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Заказов пока нет. Добавьте товары в корзину и оформите заказ.
            </p>
          )}
          {!isLoading && !error && userOrders.length > 0 && (
            <div className="overflow-x-auto">
              <OrdersTable orders={userOrders} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function OrdersTable({ orders }: { orders: OrderSummary[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Дата</TableHead>
          <TableHead>Статус</TableHead>
          <TableHead>Оплата</TableHead>
          <TableHead>Доставка</TableHead>
          <TableHead className="text-right">Сумма</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id}>
            <TableCell>#{order.id}</TableCell>
            <TableCell>{new Date(order.orderDate).toLocaleString("ru-RU")}</TableCell>
            <TableCell>{order.orderStatus}</TableCell>
            <TableCell>{order.paymentStatus}</TableCell>
            <TableCell>
              {order.deliveredOrder ? (
                <div className="text-sm leading-tight">
                  <p>
                    {new Date(order.deliveredOrder.deliveryDate).toLocaleDateString("ru-RU", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">{order.deliveredOrder.courierName}</p>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">Ожидает назначения</span>
              )}
            </TableCell>
            <TableCell className="text-right">
              {order.totalAmount.toLocaleString("ru-RU", {
                style: "currency",
                currency: "RUB",
              })}
            </TableCell>
            <TableCell className="text-right">
              <Button size="sm" variant="outline" asChild>
                <Link href={`/orders/${order.id}`}>Подробнее</Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
