using System;

namespace Models.ShopDb;

public class PendingRegistration
{
    public Guid Id { get; set; }

    public string Login { get; set; } = null!;

    public string PasswordHash { get; set; } = null!;

    public string FullName { get; set; } = null!;

    public string TelegramUsername { get; set; } = null!;

    public long? TelegramChatId { get; set; }

    public string VerificationCode { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public DateTime ExpiresAt { get; set; }

    public DateTime? ConsumedAt { get; set; }

    public long RoleId { get; set; }
}
