using System.Net.Http;
using System.Text;
using Api.Options;
using Microsoft.Extensions.Options;
using Data.ShopDb;
using Microsoft.EntityFrameworkCore;

namespace Api.Monitoring;

/// <summary>
/// Пушит бизнес-метрики напрямую в telegraf (inputs.http_listener_v2) в формате Influx line protocol.
/// </summary>
public class TelegrafPushService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<TelegrafPushService> _logger;
    private readonly TelegrafOptions _options;
    private readonly TimeSpan _interval;

    public TelegrafPushService(
        IServiceScopeFactory scopeFactory,
        IHttpClientFactory httpClientFactory,
        IOptions<TelegrafOptions> options,
        ILogger<TelegrafPushService> logger)
    {
        _scopeFactory = scopeFactory;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
        _options = options.Value;
        _interval = TimeSpan.FromSeconds(Math.Max(5, _options.IntervalSeconds));
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!_options.Enabled)
        {
            _logger.LogInformation("Telegraf push service disabled via configuration");
            return;
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await PushSnapshot(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Не удалось отправить метрики в telegraf");
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

    private async Task PushSnapshot(CancellationToken cancellationToken)
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

        var productsInStock = await context.Products
            .Where(p => !p.IsDeleted)
            .SumAsync(p => (long)p.StockQuantity, cancellationToken);

        // Формируем line protocol
        var sb = new StringBuilder();
        sb.AppendLine($"shop_api_active_users value={activeUsers}");
        sb.AppendLine($"shop_api_orders_total value={totalOrders}");
        sb.AppendLine($"shop_api_products_in_stock value={productsInStock}");

        foreach (var status in allStatuses)
        {
            var count = lookup.TryGetValue(status, out var val) ? val : 0;
            sb.AppendLine($"shop_api_orders_by_status,status={EscapeTag(status)} value={count}");
        }

        var content = new StringContent(sb.ToString(), Encoding.UTF8, "text/plain");
        var client = _httpClientFactory.CreateClient();
        var response = await client.PostAsync(_options.Url, content, cancellationToken);
        response.EnsureSuccessStatusCode();
        _logger.LogDebug("Метрики отправлены в telegraf ({Url})", _options.Url);
    }

    private static string EscapeTag(string value)
    {
        return value
            .Replace(" ", "\\ ")
            .Replace(",", "\\,")
            .Replace("=", "\\=");
    }
}
