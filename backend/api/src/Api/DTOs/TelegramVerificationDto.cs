using System.ComponentModel.DataAnnotations;

namespace Api.DTOs;

public class TelegramVerificationRequestDto
{
    [Required]
    public long UserId { get; set; }

    [Required]
    [StringLength(255)]
    public string TelegramUsername { get; set; } = null!;

    public long? TelegramChatId { get; set; }
}

public class TelegramVerificationConfirmDto
{
    [Required]
    public long UserId { get; set; }

    [Required]
    [StringLength(64)]
    public string Code { get; set; } = null!;
}

public class TelegramVerificationByLoginRequestDto
{
    [Required]
    [StringLength(255)]
    public string Login { get; set; } = null!;

    public string? TelegramUsername { get; set; }

    public long? TelegramChatId { get; set; }
}
