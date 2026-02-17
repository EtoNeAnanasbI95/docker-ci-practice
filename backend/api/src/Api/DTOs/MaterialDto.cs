using System.ComponentModel.DataAnnotations;

namespace Api.DTOs;

public class MaterialDto
{
  [Required] public long Id { get; set; }

  [Required] [StringLength(255)] public string Name { get; set; } = null!;
}

public class MaterialCreateDto
{
  [Required] [StringLength(255)] public string Name { get; set; } = null!;
}
