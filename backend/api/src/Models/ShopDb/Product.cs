using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace Models.ShopDb;

public partial class Product
{
    public long Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public long BrandId { get; set; }

    public decimal Price { get; set; }

    public int StockQuantity { get; set; }

    public string? ImageUrl { get; set; }

    public bool IsDeleted { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    [JsonIgnore] public virtual Brand Brand { get; set; } = null!;

    [JsonIgnore] public virtual ICollection<OrderDetail> OrderDetails { get; set; } = new List<OrderDetail>();

    [JsonIgnore] public virtual ICollection<Material> Materials { get; set; } = new List<Material>();
}
