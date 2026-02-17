using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace Models.ShopDb;

public partial class Brand
{
    public long Id { get; set; }

    public string Name { get; set; } = null!;

    public bool IsDeleted { get; set; }

    public DateTime CreatedAt { get; set; }

    [JsonIgnore] public virtual ICollection<Product> Products { get; set; } = new List<Product>();
}
