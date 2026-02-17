using Data.ShopDb;
using Microsoft.EntityFrameworkCore;

namespace Api.Monitoring;

/// <summary>
/// Background service that periodically snapshots domain data and pushes it to Prometheus gauges.
/// </summary>
public sealed class ShopMetricsCollector : BackgroundService
{
    private static readonly TimeSpan DefaultInterval = TimeSpan.FromSeconds(30);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ShopMetricsCollector> _logger;
    private readonly TimeSpan _interval;

    public ShopMetricsCollector(
        IServiceScopeFactory scopeFactory,
        ILogger<ShopMetricsCollector> logger,
        IConfiguration configuration)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;

        var configuredSeconds = configuration.GetValue("Monitoring:RefreshIntervalSeconds", 30);
        _interval = configuredSeconds > 0
            ? TimeSpan.FromSeconds(configuredSeconds)
            : DefaultInterval;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CollectSnapshot(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Не удалось обновить бизнес метрики для Prometheus");
            }

            try
            {
                await Task.Delay(_interval, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
        }
    }

    private async Task CollectSnapshot(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var activeUsers = await context.Users
            .CountAsync(u => !u.IsDeleted, cancellationToken);

        var totalOrders = await context.Orders
            .CountAsync(o => !o.IsDeleted, cancellationToken);

        var statusCounts = await context.Orders
            .Where(o => !o.IsDeleted)
            .GroupBy(o => o.OrderStatus.Name)
            .Select(group => new
            {
                Status = group.Key,
                Count = group.Count()
            })
            .ToListAsync(cancellationToken);

        var allStatuses = await context.OrderStatuses
            .Select(s => s.Name)
            .ToListAsync(cancellationToken);

        var lookup = statusCounts.ToDictionary(x => x.Status, x => x.Count, StringComparer.OrdinalIgnoreCase);
        foreach (var status in allStatuses)
        {
            var count = lookup.TryGetValue(status, out var value) ? value : 0;
            ShopMetrics.OrdersByStatus.WithLabels(status).Set(count);
        }

        var productsInStock = await context.Products
            .Where(p => !p.IsDeleted)
            .SumAsync(p => (long)p.StockQuantity, cancellationToken);

        ShopMetrics.ActiveUsers.Set(activeUsers);
        ShopMetrics.OrdersTotal.Set(totalOrders);
        ShopMetrics.ProductsInStock.Set(productsInStock);
    }
}
