using Prometheus;

namespace Api.Monitoring;

/// <summary>
/// Centralized registry of business metrics that Grafana uses for dashboards.
/// </summary>
public static class ShopMetrics
{
    public static readonly Gauge ActiveUsers = Metrics.CreateGauge(
        "shop_active_users_total",
        "Количество активных пользователей (не удаленных учетных записей) в магазине."
    );

    public static readonly Gauge OrdersTotal = Metrics.CreateGauge(
        "shop_orders_total",
        "Общее количество активных заказов в системе."
    );

    public static readonly Gauge OrdersByStatus = Metrics.CreateGauge(
        "shop_orders_status_total",
        "Количество заказов по статусам (не учитывая удаленные).",
        new GaugeConfiguration
        {
            LabelNames = ["status"]
        });

    public static readonly Gauge ProductsInStock = Metrics.CreateGauge(
        "shop_products_in_stock_total",
        "Общее количество товарных единиц, доступных на складе во всех категориях."
    );
}
