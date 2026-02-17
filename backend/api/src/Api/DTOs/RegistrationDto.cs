using System;
using System.ComponentModel.DataAnnotations;

namespace Api.DTOs;

public class RegistrationRequestDto
{
    [Required]
    [StringLength(255)]
    public string Login { get; set; } = null!;

    [Required]
    [StringLength(100)]
    public string Password { get; set; } = null!;

    [Required]
    [StringLength(255)]
    public string FullName { get; set; } = null!;

    [Required]
    [StringLength(255)]
    public string TelegramUsername { get; set; } = null!;
}

public class RegistrationRequestResponseDto
{
    public Guid RegistrationId { get; set; }

    public DateTime ExpiresAt { get; set; }
}

public class RegistrationConfirmDto
{
    [Required]
    public Guid RegistrationId { get; set; }

    [Required]
    [StringLength(6)]
    public string Code { get; set; } = null!;
}

public class RegistrationBotStartDto
{
    [Required]
    public Guid RegistrationId { get; set; }

    [Required]
    public long ChatId { get; set; }
}

public class RegistrationResendDto
{
    [Required]
    public Guid RegistrationId { get; set; }
}
