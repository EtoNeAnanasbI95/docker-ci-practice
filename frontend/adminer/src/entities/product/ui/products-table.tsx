'use client';

import { useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Edit, Trash2 } from 'lucide-react';
import { useProducts, useDeleteProduct } from '@/entities/product/model/hooks';
import { Product } from '@/shared/types';
import { format } from 'date-fns';
import { ProductForm } from '@/features/product/manage/ui/product-form';
import { Input } from '@/shared/ui/input';

export function ProductsTable() {
  const { data: products, isLoading, error } = useProducts();
  const deleteProduct = useDeleteProduct();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [filter, setFilter] = useState('');

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Вы уверены, что хотите удалить этот товар?')) {
      try {
        await deleteProduct.mutateAsync(id);
      } catch (error) {
        console.error('Failed to delete product:', error);
      }
    }
  };

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return products ?? [];
    return (products ?? []).filter((p) => {
      const haystack = `${p.name} ${p.description ?? ''} ${p.brand?.name ?? ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [products, filter]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Товары</CardTitle>
          <CardDescription>Загрузка товаров...</CardDescription>
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
          <CardTitle>Товары</CardTitle>
          <CardDescription>Ошибка загрузки товаров</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-destructive">
            Не удалось загрузить товары
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Товары</CardTitle>
          <CardDescription>
            Список всех товаров в вашем магазине
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 overflow-x-auto">
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <Input
              placeholder="Фильтр по названию, описанию или бренду"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="md:max-w-sm"
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Бренд</TableHead>
                <TableHead>Цена</TableHead>
                <TableHead>Остаток</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Создан</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div>{product.name}</div>
                      {product.description && (
                        <div className="text-sm text-muted-foreground">
                          {product.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{product.brand?.name || 'N/A'}</TableCell>
                  <TableCell>
                    {product.price.toLocaleString('ru-RU', {
                      style: 'currency',
                      currency: 'RUB',
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={product.stockQuantity < 10 ? 'destructive' : 'secondary'}
                    >
                      {product.stockQuantity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.isDeleted ? 'destructive' : 'default'}>
                      {product.isDeleted ? 'Удален' : 'Активен'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(product.createdAt), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(product)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(product.id)}
                        disabled={deleteProduct.isPending}
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

      <ProductForm
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        product={editingProduct}
        onSuccess={() => {
          setIsEditDialogOpen(false);
          setEditingProduct(null);
        }}
      />
    </>
  );
}
