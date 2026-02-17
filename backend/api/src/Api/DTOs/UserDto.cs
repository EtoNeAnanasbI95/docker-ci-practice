using System;
using System.ComponentModel.DataAnnotations;

namespace Api.DTOs;

public class UserDto
{
  [Required] public long Id { get; set; }

  [Required] [StringLength(255)] public string Login { get; set; } = null!;

  [Required] [StringLength(255)] public string TelegramUsername { get; set; } = null!;

  public long? TelegramChatId { get; set; }

  public bool TelegramVerified { get; set; }

  [Required] public long RoleId { get; set; }

  [StringLength(255)] public string? FullName { get; set; }

  public DateTime CreationDatetime { get; set; }

  public DateTime? UpdateDatetime { get; set; }

  public DateTime? LastLoginAt { get; set; }

  public bool IsArchived { get; set; }

  public bool IsDeleted { get; set; }

  public RoleDto? Role { get; set; }
}

public class UserCreateDto
{
  [Required] [StringLength(255)] public string Login { get; set; } = null!;

  [Required] [StringLength(255)] public string TelegramUsername { get; set; } = null!;

  public long? TelegramChatId { get; set; }

  [Required] [StringLength(100)] public string Password { get; set; } = null!;

  [Required] public long RoleId { get; set; }

  [Required] [StringLength(255)] public string FullName { get; set; } = null!;
}

public class UserUpdateDto
{
  [Required] public long Id { get; set; }

  [Required] [StringLength(255)] public string Login { get; set; } = null!;

  [Required] [StringLength(255)] public string TelegramUsername { get; set; } = null!;

  public long? TelegramChatId { get; set; }

  [Required] public long RoleId { get; set; }

  [Required] [StringLength(255)] public string FullName { get; set; } = null!;

  public bool IsArchived { get; set; }
}
