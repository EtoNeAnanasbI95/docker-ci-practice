using System;
using System.Text.Json.Serialization;

namespace Models.ShopDb;

public partial class PasswordResetToken
{
    public long Id { get; set; }

    public long UserId { get; set; }

    public Guid Token { get; set; }

    public DateTime ExpiresAt { get; set; }

    public DateTime? ConsumedAt { get; set; }

    public bool IsRevoked { get; set; }

    public DateTime CreatedAt { get; set; }

    [JsonIgnore] public virtual User User { get; set; } = null!;
}
