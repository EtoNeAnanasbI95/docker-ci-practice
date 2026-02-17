using System.ComponentModel.DataAnnotations;

namespace Api.DTOs;

public class BrandDto
{
  [Required] public long Id { get; set; }

  [Required] [StringLength(255)] public string Name { get; set; } = null!;
}

public class BrandCreateDto
{
  [Required] [StringLength(255)] public string Name { get; set; } = null!;
}
