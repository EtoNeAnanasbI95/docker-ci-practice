using System;
using System.Linq;
using Api.DTOs;
using Data.ShopDb;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Produces("application/json")]
public class AnalyticsController(AppDbContext context) : ControllerBase
{
    /// <summary>
    /// Комплексная статистика для дашборда
    /// </summary>
    [HttpGet("dashboard")]
    [ProducesResponseType(typeof(AnalyticsDashboardDto), 200)]
    public async Task<ActionResult<AnalyticsDashboardDto>> GetDashboard()
    {
        var totalProducts = await context.Products.CountAsync(p => !p.IsDeleted);
        var totalOrders = await context.Orders.CountAsync(o => !o.IsDeleted);
        var totalUsers = await context.Users.CountAsync(u => !u.IsDeleted);
        var totalRevenue = await context.Orders
            .Where(o => !o.IsDeleted)
            .SumAsync(o => (decimal?)o.TotalAmount) ?? 0m;

        var recentOrders = await context.Orders
            .Where(o => !o.IsDeleted)
            .OrderByDescending(o => o.OrderDate)
            .Take(5)
            .Select(o => new AnalyticsRecentOrderDto
            {
                Id = o.Id,
                Customer = o.User.Login,
                OrderStatus = o.OrderStatus.Name,
                PaymentStatus = o.PaymentStatus.Name,
                OrderDate = o.OrderDate
            })
            .AsNoTracking()
            .ToListAsync();

        var lowStock = await context.ProductInventoryView
            .Where(p => p.StockQuantity < 10)
            .OrderBy(p => p.StockQuantity)
            .Take(8)
            .Select(p => new AnalyticsLowStockProductDto
            {
                Id = p.Id,
                Name = p.Name,
                Brand = p.BrandName,
                StockQuantity = p.StockQuantity
            })
            .AsNoTracking()
            .ToListAsync();

        var topCustomers = await context.UserOrdersSummaryView
            .OrderByDescending(u => u.TotalSpent)
            .Take(5)
            .AsNoTracking()
            .ToListAsync();

        var salesByBrand = await context.BrandSalesAnalyticsView
            .OrderByDescending(x => x.TotalRevenue)
            .Take(8)
            .Select(x => new SalesByBrandDto
            {
                BrandId = x.BrandId,
                Brand = x.BrandName,
                Orders = x.TotalOrders,
                DeliveredOrders = x.DeliveredOrders,
                Units = x.TotalUnits,
                Revenue = x.TotalRevenue,
                AverageOrderValue = x.AvgOrderValue
            })
            .AsNoTracking()
            .ToListAsync();

        var revenueTrendRaw = await context.Orders
            .Where(o => !o.IsDeleted)
            .GroupBy(o => o.OrderDate.Date)
            .Select(g => new RevenueTrendPointDto
            {
                Date = g.Key,
                Revenue = g.Sum(o => o.TotalAmount),
                Orders = g.Count()
            })
            .OrderByDescending(x => x.Date)
            .Take(14)
            .AsNoTracking()
            .ToListAsync();

        var revenueTrend = revenueTrendRaw
            .OrderBy(x => x.Date)
            .ToList();

        var dto = new AnalyticsDashboardDto
        {
            TotalProducts = totalProducts,
            TotalOrders = totalOrders,
            TotalUsers = totalUsers,
            TotalRevenue = totalRevenue,
            RecentOrders = recentOrders,
            LowStockProducts = lowStock,
            TopCustomers = topCustomers,
            SalesByBrand = salesByBrand,
            RevenueTrend = revenueTrend
        };

        return dto;
    }

    /// <summary>
    /// Детализированная статистика продаж по брендам из представления v_brand_sales_analytics
    /// </summary>
    [HttpGet("brands")]
    [ProducesResponseType(typeof(IEnumerable<SalesByBrandDto>), 200)]
    public async Task<ActionResult<IEnumerable<SalesByBrandDto>>> GetBrandSalesAnalytics()
    {
        var items = await context.BrandSalesAnalyticsView
            .OrderByDescending(x => x.TotalRevenue)
            .Select(x => new SalesByBrandDto
            {
                BrandId = x.BrandId,
                Brand = x.BrandName,
                Orders = x.TotalOrders,
                DeliveredOrders = x.DeliveredOrders,
                Units = x.TotalUnits,
                Revenue = x.TotalRevenue,
                AverageOrderValue = x.AvgOrderValue
            })
            .AsNoTracking()
            .ToListAsync();

        return items;
    }

    /// <summary>
    /// Выручка бренда за период (использует функцию calculate_brand_sales)
    /// </summary>
    [HttpGet("brands/{brandId:long}/revenue")]
    [ProducesResponseType(typeof(BrandRevenueDto), 200)]
    public async Task<ActionResult<BrandRevenueDto>> GetBrandRevenue(long brandId, [FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var brandName = await context.Brands
            .Where(b => b.Id == brandId && !b.IsDeleted)
            .Select(b => b.Name)
            .FirstOrDefaultAsync();

        if (string.IsNullOrWhiteSpace(brandName))
        {
            return NotFound($"Бренд {brandId} не найден");
        }

        var dateTo = to ?? DateTime.UtcNow;
        var dateFrom = from ?? dateTo.AddDays(-30);

        if (dateFrom > dateTo)
        {
            return BadRequest("'from' не может быть позже 'to'");
        }

        var revenue = await context.Database
            .SqlQueryRaw<decimal>("SELECT calculate_brand_sales({0}, {1}, {2}) AS revenue",
                brandId,
                dateFrom,
                dateTo)
            .FirstAsync();

        var dto = new BrandRevenueDto
        {
            BrandId = brandId,
            BrandName = brandName,
            Revenue = revenue,
            DateFrom = dateFrom,
            DateTo = dateTo
        };

        return dto;
    }
}
