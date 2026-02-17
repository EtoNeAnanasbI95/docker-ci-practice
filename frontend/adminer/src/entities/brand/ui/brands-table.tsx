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
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Edit, Trash2 } from 'lucide-react';
import { useBrands, useDeleteBrand } from '@/entities/brand/model/hooks';
import { Brand } from '@/shared/types';
import { format } from 'date-fns';
import { BrandForm } from '@/features/brand/manage/ui/brand-form';

export function BrandsTable() {
  const { data: brands, isLoading, error } = useBrands();
  const deleteBrand = useDeleteBrand();
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Вы уверены, что хотите удалить этот бренд?')) {
      try {
        await deleteBrand.mutateAsync(id);
      } catch (error) {
        console.error('Failed to delete brand:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Бренды</CardTitle>
          <CardDescription>Загрузка брендов...</CardDescription>
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
          <CardTitle>Бренды</CardTitle>
          <CardDescription>Ошибка загрузки брендов</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-destructive">
            Не удалось загрузить бренды
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Бренды</CardTitle>
          <CardDescription>
            Список всех брендов в вашем магазине
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Создан</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {brands?.map((brand) => (
                <TableRow key={brand.id}>
                  <TableCell className="font-medium">{brand.name}</TableCell>
                  <TableCell>
                    <Badge variant={brand.isDeleted ? 'destructive' : 'default'}>
                      {brand.isDeleted ? 'Удален' : 'Активен'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(brand.createdAt), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(brand)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(brand.id)}
                        disabled={deleteBrand.isPending}
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

      <BrandForm
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        brand={editingBrand}
        onSuccess={() => {
          setIsEditDialogOpen(false);
          setEditingBrand(null);
        }}
      />
    </>
  );
}
