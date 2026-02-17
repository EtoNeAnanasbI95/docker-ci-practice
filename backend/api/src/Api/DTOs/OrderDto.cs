using System.ComponentModel.DataAnnotations;

namespace Api.DTOs;

public class OrderDto
{
  [Required] public long Id { get; set; }

  [Required] public long UserId { get; set; }

  [Required] public long OrderStatusId { get; set; }

  [Required] public long PaymentStatusId { get; set; }

  [Required] public DateTime OrderDate { get; set; }
}

public class OrderCreateDto
{
  [Required] public long UserId { get; set; }

  [Required] public long OrderStatusId { get; set; }

  [Required] public long PaymentStatusId { get; set; }
}

public class OrderStatusUpdateDto
{
  [Required] public long Id { get; set; }

  [Required] public long OrderStatusId { get; set; }

  [Required] public long PaymentStatusId { get; set; }

  public DateTime? DeliveryDate { get; set; }

  public string? CourierName { get; set; }
}
