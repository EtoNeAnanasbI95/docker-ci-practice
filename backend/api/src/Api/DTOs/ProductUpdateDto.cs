using System.ComponentModel.DataAnnotations;

namespace Api.DTOs;

public class ProductUpdateDto
{
  [Required] public long Id { get; set; }

  [Required] [StringLength(255)] public string Name { get; set; } = null!;

  [StringLength(1000)] public string? Description { get; set; }

  [Required] public long BrandId { get; set; }

  [Required]
  [Range(0, double.MaxValue, ErrorMessage = "Цена должна быть положительной")]
  public decimal Price { get; set; }

  [Required]
  [Range(0, int.MaxValue, ErrorMessage = "Количество на складе должно быть неотрицательным")]
  public int StockQuantity { get; set; }

  [StringLength(500)] public string? ImageUrl { get; set; }
}

public class ProductCreateDto
{
  [Required] [StringLength(255)] public string Name { get; set; } = null!;

  [StringLength(1000)] public string? Description { get; set; }

  [Required] public long BrandId { get; set; }

  [Required]
  [Range(0, double.MaxValue, ErrorMessage = "Цена должна быть положительной")]
  public decimal Price { get; set; }

  [Required]
  [Range(0, int.MaxValue, ErrorMessage = "Количество на складе должно быть неотрицательным")]
  public int StockQuantity { get; set; }

  [StringLength(500)] public string? ImageUrl { get; set; }
}
