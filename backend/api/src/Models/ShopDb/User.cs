using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace Models.ShopDb;

public partial class User
{
    public long Id { get; set; }

    public string Login { get; set; } = null!;

    public string TelegramUsername { get; set; } = null!;

    public long? TelegramChatId { get; set; }

    public bool TelegramVerified { get; set; }

    public string Password { get; set; } = null!;

    public long RoleId { get; set; }

    public string? FullName { get; set; }

    public DateTime CreationDatetime { get; set; }

    public DateTime? UpdateDatetime { get; set; }

    public DateTime? LastLoginAt { get; set; }

    public bool IsArchived { get; set; }

    public bool IsDeleted { get; set; }

    [JsonIgnore] public virtual ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();

    [JsonIgnore] public virtual ICollection<Order> Orders { get; set; } = new List<Order>();

    [JsonIgnore] public virtual Role Role { get; set; } = null!;

    [JsonIgnore] public virtual UserPreference? UserPreference { get; set; }

    [JsonIgnore] public virtual ICollection<PasswordResetToken> PasswordResetTokens { get; set; } = new List<PasswordResetToken>();

    [JsonIgnore] public virtual ICollection<TelegramVerificationToken> TelegramVerificationTokens { get; set; } = new List<TelegramVerificationToken>();
}
