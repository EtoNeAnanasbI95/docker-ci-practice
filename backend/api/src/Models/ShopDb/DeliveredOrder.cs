using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace Models.ShopDb;

public partial class DeliveredOrder
{
    public long OrderId { get; set; }

    public DateTime DeliveryDate { get; set; }

    public string CourierName { get; set; } = null!;

    [JsonIgnore] public virtual Order Order { get; set; } = null!;
}
