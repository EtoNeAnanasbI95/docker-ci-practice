using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace Models.ShopDb;

public partial class OrderStatus
{
    public long Id { get; set; }

    public string Name { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    [JsonIgnore] public virtual ICollection<Order> Orders { get; set; } = new List<Order>();
}
