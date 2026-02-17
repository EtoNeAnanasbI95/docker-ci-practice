"use client";

import { useMemo } from "react";
import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { useAuthSession } from "@/shared/hooks/use-auth-session";
import { apiClient } from "@/shared/api/client";

export default function OrderDetailsPage() {
  const params = useParams<{ orderId: string }>();
  const router = useRouter();
  const orderId = Number(params?.orderId);
  const { isAuthenticated, userId } = useAuthSession();

  if (Number.isNaN(orderId)) {
    notFound();
  }

  const orderQuery = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => apiClient.getOrder(orderId),
    enabled: isAuthenticated && !Number.isNaN(orderId),
  });

  const order = orderQuery.data;
  const totalItems = useMemo(() => {
    if (!order || !Array.isArray(order.items)) {
      return 0;
    }
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
  }, [order]);

  if (!isAuthenticated) {
    return (
      <div className="container space-y-6 px-4 py-10 mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Необходима авторизация</CardTitle>
            <CardDescription>Войдите в систему, чтобы просматривать детали заказа.</CardDescription>
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

  if (orderQuery.isError) {
    const err = orderQuery.error as Error;
    return (
      <div className="container space-y-4 px-4 py-10 mx-auto">
        <Button variant="ghost" onClick={() => router.back()}>
          ← Назад к списку
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Не удалось загрузить заказ</CardTitle>
            <CardDescription>{err.message}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (orderQuery.isLoading || !order) {
    return (
      <div className="container space-y-4 px-4 py-10 mx-auto">
        <Button variant="ghost" onClick={() => router.back()}>
          ← Назад к списку
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Загружаем заказ #{orderId}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Пожалуйста, подождите...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (order.userId !== userId) {
    return (
      <div className="container space-y-4 px-4 py-10 mx-auto">
        <Button variant="ghost" onClick={() => router.back()}>
          ← Назад к списку
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Нет доступа</CardTitle>
            <CardDescription>Вы не можете просматривать детали чужого заказа.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container space-y-6 px-4 py-10 mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button variant="ghost" onClick={() => router.back()} className="w-full sm:w-auto">
          ← Назад к списку
        </Button>
        <Button variant="outline" asChild className="w-full sm:w-auto">
          <Link href="/catalog">Перейти в каталог</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Заказ #{order.id}</CardTitle>
          <CardDescription className="space-y-1">
            <p>Оформлен {new Date(order.orderDate).toLocaleString("ru-RU")}</p>
            <p className="text-xs text-muted-foreground">{totalItems} позиций</p>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-3">
            <Badge variant="secondary">{order.orderStatus}</Badge>
            <Badge variant="outline">{order.paymentStatus}</Badge>
          </div>
          <p className="text-lg font-semibold">
            Сумма:{" "}
            {order.totalAmount.toLocaleString("ru-RU", {
              style: "currency",
              currency: "RUB",
            })}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Доставка</CardTitle>
          <CardDescription>Сведения из таблицы delivered_orders</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {order.deliveredOrder ? (
            <>
              <p className="text-sm text-muted-foreground">Курьер</p>
              <p className="text-base font-semibold">{order.deliveredOrder.courierName}</p>
              <p className="text-sm text-muted-foreground">Дата доставки</p>
              <p className="text-base">
                {new Date(order.deliveredOrder.deliveryDate).toLocaleString("ru-RU", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Доставка ещё не назначена. Следите за статусом заказа.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Состав заказа</CardTitle>
          <CardDescription>Данные берутся из order_details</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Товар</TableHead>
                <TableHead>Количество</TableHead>
                <TableHead className="text-right">Цена</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(order?.items ?? []).map((item) => (
                <TableRow key={item.productId}>
                  <TableCell>{item.productName}</TableCell>
                  <TableCell>{item.quantity} шт.</TableCell>
                  <TableCell className="text-right">
                    {item.priceAtMoment.toLocaleString("ru-RU", {
                      style: "currency",
                      currency: "RUB",
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
