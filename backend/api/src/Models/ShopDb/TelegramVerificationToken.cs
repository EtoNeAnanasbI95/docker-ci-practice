using System;

namespace Models.ShopDb;

public class TelegramVerificationToken
{
    public long Id { get; set; }

    public long UserId { get; set; }

    public string Code { get; set; } = null!;

    public DateTime ExpiresAt { get; set; }

    public DateTime? ConfirmedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual User User { get; set; } = null!;
}
