'use client';

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { useCart } from "@/shared/context/cart-context";
import { apiClient } from "@/shared/api/client";
import { useAuthSession } from "@/shared/hooks/use-auth-session";

export default function CartPage() {
  const cart = useCart();
  const { isAuthenticated, userId } = useAuthSession();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    if (!isAuthenticated || !userId) {
      setError("Авторизуйтесь, чтобы оформить заказ");
      setStatus("error");
      return;
    }

    if (cart.items.length === 0) {
      return;
    }

    setStatus("loading");
    setError(null);
    try {
      await apiClient.checkoutOrder({
        userId,
        items: cart.items.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
      });
      await cart.checkout();
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error ? err.message : "Не удалось оформить заказ. Попробуйте ещё раз."
      );
    }
  };

  return (
    <div className="container space-y-6 px-4 py-10 mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
            Корзина
          </p>
          <h1 className="text-3xl font-semibold">Проверьте заказ</h1>
        </div>
        <Button variant="ghost" asChild className="w-full sm:w-auto">
          <a href="/favorites">Избранное</a>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Товары</CardTitle>
            <CardDescription>Данные будут браться из order_details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {cart.items.length === 0 ? (
              <div className="text-center text-muted-foreground">Корзина пустая</div>
            ) : (
              cart.items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-md border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.price.toLocaleString("ru-RU", {
                        style: "currency",
                        currency: "RUB",
                      })}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      type="number"
                      value={item.quantity}
                      min={1}
                      className="w-24"
                      onChange={(event) =>
                        cart.updateQuantity(item.id, Number(event.target.value))
                      }
                    />
                    <Button variant="ghost" size="sm" onClick={() => cart.removeFromCart(item.id)}>
                      Удалить
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Итого</CardTitle>
            <CardDescription>Далее будет вызываться процедура создания заказа</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>К оплате</span>
              <span>
                {cart.total.toLocaleString("ru-RU", {
                  style: "currency",
                  currency: "RUB",
                })}
              </span>
            </div>
            <Button className="w-full" disabled={cart.items.length === 0 || status === "loading"} onClick={handleCheckout}>
              {status === "loading" ? "Оформляем..." : "Оформить заказ"}
            </Button>
            {status === "success" && (
              <p className="text-sm text-emerald-600">
                Заказ оформлен! Детали появятся в разделе заказов после обработки.
              </p>
            )}
            {status === "error" && (
              <p className="text-sm text-destructive">
                {error ?? "Не удалось оформить заказ. Попробуйте ещё раз."}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
