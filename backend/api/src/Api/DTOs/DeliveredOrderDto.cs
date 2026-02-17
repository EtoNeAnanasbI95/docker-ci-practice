using System.ComponentModel.DataAnnotations;

namespace Api.DTOs;

public class DeliveredOrderDto
{
    [Required]
    public long OrderId { get; set; }

    [Required]
    public DateTime DeliveryDate { get; set; }

    [Required]
    [MaxLength(255)]
    public string CourierName { get; set; } = null!;
}
