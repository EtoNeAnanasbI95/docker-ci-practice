import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import { CreateOrderStatusData, UpdateOrderStatusData } from '@/shared/types';

export function useOrderStatuses() {
  return useQuery({
    queryKey: ['orderStatuses'],
    queryFn: () => apiClient.getOrderStatuses(),
  });
}

export function useCreateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrderStatusData) => apiClient.createOrderStatus(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orderStatuses'] });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateOrderStatusData }) =>
      apiClient.updateOrderStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orderStatuses'] });
    },
  });
}

export function useDeleteOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => apiClient.deleteOrderStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orderStatuses'] });
    },
  });
}
