"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { useFavorites } from "@/shared/context/favorites-context";
import { CartQuantityControl } from "@/components/catalog/cart-quantity-control";

export default function FavoritesPage() {
  const favorites = useFavorites();

  return (
    <div className="container space-y-6 px-4 py-10 mx-auto">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
          Избранное
        </p>
        <h1 className="text-3xl font-semibold">Товары, которые вам понравились</h1>
      </div>

      {favorites.favorites.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Список пуст. Добавьте товары из каталога.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {favorites.favorites.map((item) => (
            <Card key={item.id}>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>{item.name}</CardTitle>
                  <CardDescription>
                    {item.brandName} ·{" "}
                    {Number(item.price).toLocaleString("ru-RU", {
                      style: "currency",
                      currency: "RUB",
                    })}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <CartQuantityControl product={item} />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => favorites.removeFavorite(item.id)}
                  >
                    Удалить
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
