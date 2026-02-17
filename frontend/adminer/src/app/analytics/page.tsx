"use client";

import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/widgets/admin-layout/ui/admin-layout';
import { useDashboardStats, useBrandSalesAnalytics, useBrandRevenue } from '@/widgets/dashboard/model/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { downloadCsv } from '@/shared/lib/csv';
import { AlertTriangle, BarChart3, Download, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import type { AnalyticsRevenuePoint, AnalyticsSalesByBrand } from '@/shared/types';

const ADMIN_ONLY: Array<'admin'> = ['admin'];

export default function AnalyticsPage() {
  const { data: stats, isLoading, error } = useDashboardStats();
  const { data: brandAnalytics } = useBrandSalesAnalytics();
  const salesByBrand = useMemo(
    () => (brandAnalytics?.length ? brandAnalytics : stats?.salesByBrand ?? []),
    [brandAnalytics, stats?.salesByBrand]
  );
  const handleExportRevenueCsv = () => {
    if (!stats?.revenueTrend?.length) {
      return;
    }

    downloadCsv(
      'revenue-trend.csv',
      ['Дата', 'Выручка', 'Количество заказов'],
      stats.revenueTrend.map((point) => [
        format(new Date(point.date), 'yyyy-MM-dd'),
        point.revenue.toFixed(2),
        point.orders,
      ])
    );
  };

  const handleExportBrandCsv = () => {
    if (!salesByBrand.length) {
      return;
    }

    downloadCsv(
      'sales-by-brand.csv',
      ['Бренд', 'Заказы', 'Доставлено', 'Товары', 'Выручка', 'Средний чек'],
      salesByBrand.map((item) => [
        item.brand,
        item.orders,
        item.deliveredOrders,
        item.units,
        item.revenue.toFixed(2),
        item.averageOrderValue.toFixed(2),
      ])
    );
  };

  const handleExportTopCustomersCsv = () => {
    if (!stats?.topCustomers?.length) {
      return;
    }

    downloadCsv(
      'top-customers.csv',
      ['Логин', 'Telegram', 'Всего заказов', 'Потрачено', 'Последний заказ'],
      stats.topCustomers.map((customer) => [
        customer.login,
        `@${customer.telegramUsername ?? 'unknown'}`,
        customer.totalOrders,
        customer.totalSpent.toFixed(2),
        customer.lastOrderAt ? format(new Date(customer.lastOrderAt), 'yyyy-MM-dd') : '',
      ])
    );
  };

  if (isLoading) {
    return (
      <AdminLayout allowedRoles={ADMIN_ONLY}>
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          Загрузка аналитики...
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout allowedRoles={ADMIN_ONLY}>
        <div className="flex h-64 items-center justify-center text-destructive">
          Не удалось получить аналитические данные
        </div>
      </AdminLayout>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <AdminLayout allowedRoles={ADMIN_ONLY}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Аналитика продаж</h1>
          <p className="text-muted-foreground">
            Сводные показатели магазина на основе SQL представлений и процедур
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <AnalyticsCard title="Выручка" value={`₽${stats?.totalRevenue.toLocaleString('ru-RU') ?? '0'}`} icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />} />
          <AnalyticsCard title="Заказы" value={stats?.totalOrders ?? 0} icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />} />
          <AnalyticsCard title="Покупатели" value={stats?.totalUsers ?? 0} icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />} />
          <AnalyticsCard title="Товары" value={stats?.totalProducts ?? 0} icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Динамика выручки</CardTitle>
                <CardDescription>Последние 14 дней</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportRevenueCsv}
                disabled={!stats.revenueTrend?.length}
                className="inline-flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                CSV
              </Button>
            </CardHeader>
            <CardContent>
              <RevenueChart data={stats.revenueTrend} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Продажи по брендам</CardTitle>
                <CardDescription>Агрегировано по заказам и позициям</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportBrandCsv}
                disabled={!salesByBrand.length}
                className="inline-flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                CSV
              </Button>
            </CardHeader>
            <CardContent>
              <BrandSalesChart data={salesByBrand} />
            </CardContent>
          </Card>
        </div>

        <BrandRevenueInspector data={salesByBrand} />

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Последние заказы</CardTitle>
              <CardDescription>Синхронизировано с процедурой расчёта totals</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats?.recentOrders?.map((order) => (
                <div key={order.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium">Заказ #{order.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.customer || 'N/A'} · {format(new Date(order.orderDate), 'dd MMM yyyy')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="outline">{order.orderStatus}</Badge>
                    <Badge variant="secondary">{order.paymentStatus}</Badge>
                  </div>
                </div>
              )) ?? <p className="text-sm text-muted-foreground">Нет заказов</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Товары с низким остатком
              </CardTitle>
              <CardDescription>Данные из представления v_product_inventory</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats?.lowStockProducts?.length ? (
                stats.lowStockProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.brand}</p>
                    </div>
                    <Badge variant="destructive">Остаток {product.stockQuantity}</Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Все товары пополнены</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Топ клиентов</CardTitle>
              <CardDescription>По представлению v_user_orders_summary</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportTopCustomersCsv}
              disabled={!stats.topCustomers?.length}
              className="inline-flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              CSV
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Пользователь</TableHead>
                  <TableHead>Всего заказов</TableHead>
                  <TableHead>Потрачено</TableHead>
                  <TableHead>Последний заказ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats?.topCustomers?.map((customer) => (
                  <TableRow key={customer.userId}>
                    <TableCell>
                      <div className="font-medium">{customer.login}</div>
                      <div className="text-xs text-muted-foreground">@{customer.telegramUsername ?? 'unknown'}</div>
                    </TableCell>
                    <TableCell>{customer.totalOrders}</TableCell>
                    <TableCell>
                      ₽{customer.totalSpent.toLocaleString('ru-RU', { maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      {customer.lastOrderAt
                        ? format(new Date(customer.lastOrderAt), 'dd MMM yyyy')
                        : '—'}
                    </TableCell>
                  </TableRow>
                )) ?? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Нет данных
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

function AnalyticsCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function RevenueChart({ data }: { data: AnalyticsRevenuePoint[] }) {
  if (!data?.length) {
    return <p className="text-sm text-muted-foreground">Недостаточно данных для построения графика</p>;
  }

  const maxRevenue = Math.max(...data.map((point) => point.revenue), 0) || 1;
  const normalizedPoints = data.map((point, index) => {
    const x = data.length === 1 ? 0 : (index / (data.length - 1)) * 100;
    const y = 100 - (point.revenue / maxRevenue) * 100;
    return { x, y };
  });
  const polylinePoints = normalizedPoints.map((point) => `${point.x},${point.y}`).join(' ');
  const areaPoints = `0,100 ${polylinePoints} 100,100`;
  const tickIndexes = Array.from(new Set([0, Math.floor((data.length - 1) / 2), data.length - 1])).filter(
    (index) => data[index]
  );
  const lastPoint = data[data.length - 1];

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-border px-4 py-3">
        <div className="grid gap-1 text-sm">
          <p className="text-muted-foreground">Последняя дата</p>
          <p className="text-base font-semibold">
            {format(new Date(lastPoint.date), 'dd MMM yyyy')} · ₽
            {lastPoint.revenue.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} · {lastPoint.orders} заказов
          </p>
        </div>
      </div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-56 w-full" role="img" aria-hidden="true">
        <defs>
          <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill="url(#revenueGradient)" />
        <polyline
          points={polylinePoints}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="flex justify-between text-xs text-muted-foreground">
        {tickIndexes.map((index) => (
          <span key={data[index].date}>{format(new Date(data[index].date), 'dd.MM')}</span>
        ))}
      </div>
    </div>
  );
}

const RANGE_OPTIONS = [
  { value: '7', label: '7 дней' },
  { value: '30', label: '30 дней' },
  { value: '90', label: '90 дней' },
];

function BrandRevenueInspector({ data }: { data: AnalyticsSalesByBrand[] }) {
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  const [range, setRange] = useState('30');

  useEffect(() => {
    if (!selectedBrandId && data?.length) {
      setSelectedBrandId(data[0].brandId);
    }
  }, [data, selectedBrandId]);

  const { fromIso, toIso } = useMemo(() => {
    const end = new Date();
    const start = new Date(end);
    start.setDate(end.getDate() - Number(range));
    return {
      fromIso: start.toISOString(),
      toIso: end.toISOString(),
    };
  }, [range]);

  const revenueQuery = useBrandRevenue(selectedBrandId, fromIso, toIso);
  const activeBrand = data?.find((item) => item.brandId === selectedBrandId);

  if (!data?.length) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Выручка по бренду</CardTitle>
          <CardDescription>
            Функция <code>calculate_brand_sales</code> считает выручку за выбранный период.
          </CardDescription>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select
            value={selectedBrandId ? String(selectedBrandId) : undefined}
            onValueChange={(value) => setSelectedBrandId(Number(value))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Выберите бренд" />
            </SelectTrigger>
            <SelectContent>
              {data.map((item) => (
                <SelectItem key={item.brandId} value={String(item.brandId)}>
                  {item.brand}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RANGE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Выручка</p>
            <p className="text-2xl font-semibold">
              ₽{(revenueQuery.data?.revenue ?? 0).toLocaleString('ru-RU', { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-muted-foreground">
              {revenueQuery.data
                ? `${format(new Date(revenueQuery.data.dateFrom), 'dd MMM')} · ${format(
                    new Date(revenueQuery.data.dateTo),
                    'dd MMM'
                  )}`
                : 'Укажите период'}
            </p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Заказы</p>
            <p className="text-2xl font-semibold">{activeBrand?.orders ?? 0}</p>
            <p className="text-xs text-muted-foreground">всего оформлено</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Доставлено</p>
            <p className="text-2xl font-semibold">{activeBrand?.deliveredOrders ?? 0}</p>
            <p className="text-xs text-muted-foreground">курьером</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Средний чек</p>
            <p className="text-2xl font-semibold">
              ₽{(activeBrand?.averageOrderValue ?? 0).toLocaleString('ru-RU', { minimumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-muted-foreground">по всем заказам бренда</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Товары от бренда отгружены в количестве: {activeBrand?.units ?? 0}. Отчёт строится вместе с представлением
          <code className="ml-1">v_brand_sales_analytics</code>.
        </p>
      </CardContent>
    </Card>
  );
}

function BrandSalesChart({ data }: { data: AnalyticsSalesByBrand[] }) {
  if (!data?.length) {
    return <p className="text-sm text-muted-foreground">Нет заказов для расчёта продаж</p>;
  }

  const maxRevenue = Math.max(...data.map((item) => item.revenue), 0) || 1;

  return (
    <div className="space-y-4">
      {data.map((item) => (
        <div key={item.brand} className="space-y-2">
          <div className="flex items-center justify-between text-sm font-medium">
            <span>{item.brand}</span>
            <span>₽{item.revenue.toLocaleString('ru-RU', { maximumFractionDigits: 2 })}</span>
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${(item.revenue / maxRevenue) * 100}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Заказов: {item.orders} · Доставлено: {item.deliveredOrders}
          </p>
          <p className="text-xs text-muted-foreground">
            Средний чек: ₽{item.averageOrderValue.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} · Товаров: {item.units}
          </p>
        </div>
      ))}
    </div>
  );
}
