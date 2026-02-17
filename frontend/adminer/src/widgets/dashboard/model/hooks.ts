import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['analyticsDashboard'],
    queryFn: () => apiClient.getAnalyticsDashboard(),
  });
}

export function useBrandSalesAnalytics() {
  return useQuery({
    queryKey: ['brandSalesAnalytics'],
    queryFn: () => apiClient.getBrandSalesAnalytics(),
  });
}

export function useBrandRevenue(brandId: number | null, from?: string, to?: string) {
  return useQuery({
    queryKey: ['brandRevenue', brandId, from, to],
    queryFn: () => apiClient.getBrandRevenue(brandId!, { from, to }),
    enabled: Boolean(brandId),
  });
}
