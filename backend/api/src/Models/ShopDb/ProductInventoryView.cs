using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace Models.ShopDb;

public class ProductInventoryView
{
    public long Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public decimal Price { get; set; }

    public int StockQuantity { get; set; }

    public string? ImageUrl { get; set; }

    [JsonPropertyName("brandName")]
    public string BrandName { get; set; } = null!;

    [JsonPropertyName("materials")]
    public List<string> Materials { get; set; } = new();
}
