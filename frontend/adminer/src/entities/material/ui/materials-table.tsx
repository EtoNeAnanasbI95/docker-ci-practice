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
import { useMaterials, useDeleteMaterial } from '@/entities/material/model/hooks';
import { Material } from '@/shared/types';
import { MaterialForm } from '@/features/material/manage/ui/material-form';
import { format } from 'date-fns';

export function MaterialsTable() {
  const { data: materials, isLoading, error } = useMaterials();
  const deleteMaterial = useDeleteMaterial();
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Вы уверены, что хотите удалить этот материал?')) {
      try {
        await deleteMaterial.mutateAsync(id);
      } catch (error) {
        console.error('Failed to delete material:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Материалы</CardTitle>
          <CardDescription>Загрузка материалов...</CardDescription>
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
          <CardTitle>Материалы</CardTitle>
          <CardDescription>Ошибка загрузки материалов</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-destructive">
            Не удалось загрузить материалы
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Материалы</CardTitle>
          <CardDescription>
            Список всех материалов в вашем магазине
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Создан</TableHead>
                <TableHead>Обновлен</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials?.map((material) => (
                <TableRow key={material.id}>
                  <TableCell className="font-medium">{material.name}</TableCell>
                  <TableCell>
                    <Badge variant={material.isDeleted ? 'destructive' : 'default'}>
                      {material.isDeleted ? 'Удален' : 'Активен'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(material.createdAt), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    {format(new Date(material.updatedAt), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(material)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(material.id)}
                        disabled={deleteMaterial.isPending}
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

      <MaterialForm
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        material={editingMaterial}
        onSuccess={() => {
          setIsEditDialogOpen(false);
          setEditingMaterial(null);
        }}
      />
    </>
  );
}
