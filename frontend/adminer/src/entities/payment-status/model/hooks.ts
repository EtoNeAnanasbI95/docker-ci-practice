import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import { CreatePaymentStatusData, UpdatePaymentStatusData } from '@/shared/types';

export function usePaymentStatuses() {
  return useQuery({
    queryKey: ['paymentStatuses'],
    queryFn: () => apiClient.getPaymentStatuses(),
  });
}

export function useCreatePaymentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePaymentStatusData) => apiClient.createPaymentStatus(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentStatuses'] });
    },
  });
}

export function useUpdatePaymentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePaymentStatusData }) =>
      apiClient.updatePaymentStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentStatuses'] });
    },
  });
}

export function useDeletePaymentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => apiClient.deletePaymentStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentStatuses'] });
    },
  });
}
