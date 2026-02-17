using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace Models.ShopDb;

public partial class OrderDetail
{
    public long OrderId { get; set; }

    public long ProductId { get; set; }

    public int Quantity { get; set; }

    public decimal PriceAtMoment { get; set; }

    [JsonIgnore] public virtual Order Order { get; set; } = null!;

    [JsonIgnore] public virtual Product Product { get; set; } = null!;
}
