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
import { useCreateBrand, useUpdateBrand } from '@/entities/brand/model/hooks';
import { Brand, CreateBrandData, UpdateBrandData } from '@/shared/types';

const brandSchema = z.object({
  name: z.string().min(1, 'Название обязательно'),
});

type BrandFormData = z.infer<typeof brandSchema>;

interface BrandFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brand?: Brand | null;
  onSuccess?: () => void;
}

export function BrandForm({ open, onOpenChange, brand, onSuccess }: BrandFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createBrand = useCreateBrand();
  const updateBrand = useUpdateBrand();

  const form = useForm<BrandFormData>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: '',
    },
  });

  useEffect(() => {
    if (brand) {
      form.reset({
        name: brand.name,
      });
    } else {
      form.reset({
        name: '',
      });
    }
  }, [brand, form]);

  const onSubmit = async (data: BrandFormData) => {
    setIsSubmitting(true);
    try {
      if (brand) {
        const updateData: UpdateBrandData = {
          id: brand.id,
          ...data,
        };
        await updateBrand.mutateAsync({ id: brand.id, data: updateData });
      } else {
        const createData: CreateBrandData = data;
        await createBrand.mutateAsync(createData);
      }
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save brand:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {brand ? 'Редактировать бренд' : 'Создать бренд'}
          </DialogTitle>
          <DialogDescription>
            {brand
              ? 'Обновите информацию о бренде ниже.'
              : 'Добавьте новый бренд в магазин.'}
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
                    <Input placeholder="Название бренда" {...field} />
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
                {isSubmitting ? 'Сохранение...' : brand ? 'Обновить' : 'Создать'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
