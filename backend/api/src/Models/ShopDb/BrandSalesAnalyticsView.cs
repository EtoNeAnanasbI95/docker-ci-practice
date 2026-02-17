namespace Models.ShopDb;

public class BrandSalesAnalyticsView
{
    public long BrandId { get; set; }

    public string BrandName { get; set; } = null!;

    public int TotalOrders { get; set; }

    public int DeliveredOrders { get; set; }

    public int TotalUnits { get; set; }

    public decimal TotalRevenue { get; set; }

    public decimal AvgOrderValue { get; set; }
}
