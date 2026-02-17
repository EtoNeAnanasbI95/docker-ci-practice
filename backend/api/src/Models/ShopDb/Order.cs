using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace Models.ShopDb;

public partial class Order
{
    public long Id { get; set; }

    public long UserId { get; set; }

    public long OrderStatusId { get; set; }

    public long PaymentStatusId { get; set; }

    public DateTime OrderDate { get; set; }

    public decimal TotalAmount { get; set; }

    public string? DeliveryAddress { get; set; }

    public string? PaymentMethod { get; set; }

    public bool IsDeleted { get; set; }

    [JsonIgnore] public virtual DeliveredOrder? DeliveredOrder { get; set; }

    [JsonIgnore] public virtual ICollection<OrderDetail> OrderDetails { get; set; } = new List<OrderDetail>();

    [JsonIgnore] public virtual OrderStatus OrderStatus { get; set; } = null!;

    [JsonIgnore] public virtual PaymentStatus PaymentStatus { get; set; } = null!;

    [JsonIgnore] public virtual User User { get; set; } = null!;
}
