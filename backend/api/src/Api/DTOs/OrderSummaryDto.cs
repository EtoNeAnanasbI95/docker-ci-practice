namespace Api.DTOs;

public class OrderSummaryDto
{
    public long Id { get; set; }

    public long UserId { get; set; }

    public DateTime OrderDate { get; set; }

    public decimal TotalAmount { get; set; }

    public long OrderStatusId { get; set; }

    public string OrderStatus { get; set; } = null!;

    public long PaymentStatusId { get; set; }

    public string PaymentStatus { get; set; } = null!;

    public string? CustomerLogin { get; set; }

    public string? CustomerTelegram { get; set; }

    public string? CustomerName { get; set; }

    public DeliveredOrderSummaryDto? DeliveredOrder { get; set; }
}

public class OrderItemDto
{
    public long ProductId { get; set; }

    public string ProductName { get; set; } = null!;

    public int Quantity { get; set; }

    public decimal PriceAtMoment { get; set; }
}

public class OrderDetailsDto : OrderSummaryDto
{
    public List<OrderItemDto> Items { get; set; } = new();
}

public class DeliveredOrderSummaryDto
{
    public long OrderId { get; set; }

    public DateTime DeliveryDate { get; set; }

    public string CourierName { get; set; } = null!;
}
