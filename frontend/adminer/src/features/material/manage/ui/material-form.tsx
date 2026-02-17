'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { useCreateMaterial, useUpdateMaterial } from '@/entities/material/model/hooks';
import { Material, CreateMaterialData, UpdateMaterialData } from '@/shared/types';

const materialSchema = z.object({
  name: z.string().min(1, 'Название обязательно'),
});

type MaterialFormData = z.infer<typeof materialSchema>;

interface MaterialFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material?: Material | null;
  onSuccess?: () => void;
}

export function MaterialForm({ open, onOpenChange, material, onSuccess }: MaterialFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createMaterial = useCreateMaterial();
  const updateMaterial = useUpdateMaterial();

  const form = useForm<MaterialFormData>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      name: '',
    },
  });

  useEffect(() => {
    if (material) {
      form.reset({
        name: material.name,
      });
    } else {
      form.reset({
        name: '',
      });
    }
  }, [material, form]);

  const onSubmit = async (data: MaterialFormData) => {
    setIsSubmitting(true);
    try {
      if (material) {
        const updateData: UpdateMaterialData = {
          id: material.id,
          ...data,
        };
        await updateMaterial.mutateAsync({ id: material.id, data: updateData });
      } else {
        const createData: CreateMaterialData = data;
        await createMaterial.mutateAsync(createData);
      }
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save material:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {material ? 'Редактировать материал' : 'Создать материал'}
          </DialogTitle>
          <DialogDescription>
            {material
              ? 'Обновите информацию о материале ниже.'
              : 'Добавьте новый материал в магазин.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название</FormLabel>
                  <FormControl>
                    <Input placeholder="Название материала" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Сохранение...' : material ? 'Обновить' : 'Создать'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
