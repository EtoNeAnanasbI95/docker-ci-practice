using System.ComponentModel.DataAnnotations;

namespace Api.DTOs;

public class UserPreferenceDto
{
  [Required] public long UserId { get; set; }

  [Required] [StringLength(32)] public string Theme { get; set; } = "light";
}

public class PasswordResetRequestDto
{
  [Required] [StringLength(255)] public string LoginOrTelegram { get; set; } = null!;
}

public class PasswordResetCompleteDto
{
  [Required] public Guid Token { get; set; }

  [Required]
  [StringLength(100, MinimumLength = 6, ErrorMessage = "Пароль должен быть не короче 6 символов")]
  public string NewPassword { get; set; } = null!;
}
