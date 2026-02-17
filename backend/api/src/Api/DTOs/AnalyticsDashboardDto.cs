using Models.ShopDb;

namespace Api.DTOs;

public class AnalyticsDashboardDto
{
    public int TotalProducts { get; set; }

    public int TotalOrders { get; set; }

    public int TotalUsers { get; set; }

    public decimal TotalRevenue { get; set; }

    public required IEnumerable<AnalyticsRecentOrderDto> RecentOrders { get; set; }

    public required IEnumerable<AnalyticsLowStockProductDto> LowStockProducts { get; set; }

    public required IEnumerable<UserOrdersSummaryView> TopCustomers { get; set; }

    public required IEnumerable<SalesByBrandDto> SalesByBrand { get; set; }

    public required IEnumerable<RevenueTrendPointDto> RevenueTrend { get; set; }
}

public class AnalyticsRecentOrderDto
{
    public long Id { get; set; }
    public string Customer { get; set; } = string.Empty;
    public string OrderStatus { get; set; } = string.Empty;
    public string PaymentStatus { get; set; } = string.Empty;
    public DateTime OrderDate { get; set; }
}

public class AnalyticsLowStockProductDto
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Brand { get; set; } = string.Empty;
    public int StockQuantity { get; set; }
}

public class SalesByBrandDto
{
    public long BrandId { get; set; }
    public string Brand { get; set; } = string.Empty;
    public int Orders { get; set; }
    public int DeliveredOrders { get; set; }
    public int Units { get; set; }
    public decimal Revenue { get; set; }
    public decimal AverageOrderValue { get; set; }
}

public class RevenueTrendPointDto
{
    public DateTime Date { get; set; }
    public decimal Revenue { get; set; }
    public int Orders { get; set; }
}

public class BrandRevenueDto
{
    public long BrandId { get; set; }
    public string BrandName { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
    public DateTime DateFrom { get; set; }
    public DateTime DateTo { get; set; }
}
