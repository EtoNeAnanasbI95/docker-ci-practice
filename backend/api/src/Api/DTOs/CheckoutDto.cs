using System.ComponentModel.DataAnnotations;

namespace Api.DTOs;

public class CheckoutItemDto
{
    [Required] public long ProductId { get; set; }

    [Range(1, int.MaxValue)] public int Quantity { get; set; }
}

public class CreateOrderRequestDto
{
    [Required] public long UserId { get; set; }

    [Required] public List<CheckoutItemDto> Items { get; set; } = new();

    public long? PaymentStatusId { get; set; }

    public long? OrderStatusId { get; set; }
}

public class CheckoutResultDto
{
    public long OrderId { get; set; }

    public decimal TotalAmount { get; set; }
}
