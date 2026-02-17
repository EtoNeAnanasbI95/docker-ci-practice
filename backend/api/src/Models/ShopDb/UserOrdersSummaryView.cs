using System;

namespace Models.ShopDb;

public class UserOrdersSummaryView
{
    public long UserId { get; set; }

    public string Login { get; set; } = null!;

    public string TelegramUsername { get; set; } = null!;

    public int TotalOrders { get; set; }

    public decimal TotalSpent { get; set; }

    public DateTime? LastOrderAt { get; set; }
}
