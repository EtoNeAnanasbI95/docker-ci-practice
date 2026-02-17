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
import { useCreateOrderStatus, useUpdateOrderStatus } from '@/entities/order-status/model/hooks';
import { OrderStatus, CreateOrderStatusData, UpdateOrderStatusData } from '@/shared/types';

const orderStatusSchema = z.object({
  name: z.string().min(1, 'Название обязательно'),
});

type OrderStatusFormData = z.infer<typeof orderStatusSchema>;

interface OrderStatusFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderStatus?: OrderStatus | null;
  onSuccess?: () => void;
}

export function OrderStatusForm({ open, onOpenChange, orderStatus, onSuccess }: OrderStatusFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createOrderStatus = useCreateOrderStatus();
  const updateOrderStatus = useUpdateOrderStatus();

  const form = useForm<OrderStatusFormData>({
    resolver: zodResolver(orderStatusSchema),
    defaultValues: {
      name: '',
    },
  });

  useEffect(() => {
    if (orderStatus) {
      form.reset({
        name: orderStatus.name,
      });
    } else {
      form.reset({
        name: '',
      });
    }
  }, [orderStatus, form]);

  const onSubmit = async (data: OrderStatusFormData) => {
    setIsSubmitting(true);
    try {
      if (orderStatus) {
        const updateData: UpdateOrderStatusData = {
          id: orderStatus.id,
          ...data,
        };
        await updateOrderStatus.mutateAsync({ id: orderStatus.id, data: updateData });
      } else {
        const createData: CreateOrderStatusData = data;
        await createOrderStatus.mutateAsync(createData);
      }
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save order status:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {orderStatus ? 'Редактировать статус заказа' : 'Создать статус заказа'}
          </DialogTitle>
          <DialogDescription>
            {orderStatus
              ? 'Обновите информацию о статусе заказа ниже.'
              : 'Добавьте новый статус заказа в систему.'}
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
                    <Input placeholder="Название статуса заказа" {...field} />
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
                {isSubmitting ? 'Сохранение...' : orderStatus ? 'Обновить' : 'Создать'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
