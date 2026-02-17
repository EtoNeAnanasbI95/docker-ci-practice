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
import { useCreatePaymentStatus, useUpdatePaymentStatus } from '@/entities/payment-status/model/hooks';
import { PaymentStatus, CreatePaymentStatusData, UpdatePaymentStatusData } from '@/shared/types';

const paymentStatusSchema = z.object({
  name: z.string().min(1, 'Название обязательно'),
});

type PaymentStatusFormData = z.infer<typeof paymentStatusSchema>;

interface PaymentStatusFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentStatus?: PaymentStatus | null;
  onSuccess?: () => void;
}

export function PaymentStatusForm({ open, onOpenChange, paymentStatus, onSuccess }: PaymentStatusFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createPaymentStatus = useCreatePaymentStatus();
  const updatePaymentStatus = useUpdatePaymentStatus();

  const form = useForm<PaymentStatusFormData>({
    resolver: zodResolver(paymentStatusSchema),
    defaultValues: {
      name: '',
    },
  });

  useEffect(() => {
    if (paymentStatus) {
      form.reset({
        name: paymentStatus.name,
      });
    } else {
      form.reset({
        name: '',
      });
    }
  }, [paymentStatus, form]);

  const onSubmit = async (data: PaymentStatusFormData) => {
    setIsSubmitting(true);
    try {
      if (paymentStatus) {
        const updateData: UpdatePaymentStatusData = {
          id: paymentStatus.id,
          ...data,
        };
        await updatePaymentStatus.mutateAsync({ id: paymentStatus.id, data: updateData });
      } else {
        const createData: CreatePaymentStatusData = data;
        await createPaymentStatus.mutateAsync(createData);
      }
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save payment status:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {paymentStatus ? 'Редактировать статус платежа' : 'Создать статус платежа'}
          </DialogTitle>
          <DialogDescription>
            {paymentStatus
              ? 'Обновите информацию о статусе платежа ниже.'
              : 'Добавьте новый статус платежа в систему.'}
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
                    <Input placeholder="Название статуса платежа" {...field} />
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
                {isSubmitting ? 'Сохранение...' : paymentStatus ? 'Обновить' : 'Создать'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
