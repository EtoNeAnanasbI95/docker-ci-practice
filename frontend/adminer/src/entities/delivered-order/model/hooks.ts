import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import { CreateDeliveredOrderData, UpdateDeliveredOrderData } from '@/shared/types';

export function useDeliveredOrders() {
  return useQuery({
    queryKey: ['deliveredOrders'],
    queryFn: () => apiClient.getDeliveredOrders(),
  });
}

export function useCreateDeliveredOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDeliveredOrderData) => apiClient.createDeliveredOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveredOrders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useUpdateDeliveredOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateDeliveredOrderData }) =>
      apiClient.updateDeliveredOrder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveredOrders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useDeleteDeliveredOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => apiClient.deleteDeliveredOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveredOrders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
