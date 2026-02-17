'use client';

import { ProductInventoryItem } from '@/shared/types';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { useFavorites } from '@/shared/context/favorites-context';
import { CartQuantityControl } from '@/components/catalog/cart-quantity-control';

type ProductGridProps = {
  products: ProductInventoryItem[];
  emptyMessage?: string;
  maxCols?: string;
};

export function ProductGrid({
  products,
  emptyMessage,
  maxCols = 'sm:grid-cols-2 lg:grid-cols-3',
}: ProductGridProps) {
  const favorites = useFavorites();

  if (!products.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          {emptyMessage ?? 'Нет товаров'}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`grid grid-cols-1 gap-6 ${maxCols}`}>
      {products.map((product) => {
        const isFav = favorites.isFavorite(product.id);
        return (
          <Card key={product.id} className="flex flex-col overflow-hidden">
            <div className="relative h-48 w-full bg-muted">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                  Фото скоро появится
                </div>
              )}
            </div>
            <CardHeader>
              <CardTitle>{product.name}</CardTitle>
              <CardDescription>{product.brandName}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-4">
              <p className="text-sm text-muted-foreground line-clamp-3">
                {product.description}
              </p>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {product.materials.map((material) => (
                  <span key={`${product.id}-${material}`} className="rounded-full bg-muted px-3 py-1">
                    {material}
                  </span>
                ))}
              </div>
              <div className="mt-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-lg font-semibold">
                    {product.price.toLocaleString('ru-RU', {
                      style: 'currency',
                      currency: 'RUB',
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">Остаток: {product.stockQuantity} шт.</p>
                </div>
                <div className="grid gap-2 sm:justify-items-end">
                  <Button
                    size="sm"
                    variant={isFav ? 'destructive' : 'outline'}
                    className="w-full sm:w-auto"
                    onClick={() => favorites.toggleFavorite(product)}
                  >
                    {isFav ? 'Удалить из избранного' : 'Добавить в избранное'}
                  </Button>
                  <CartQuantityControl product={product} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
