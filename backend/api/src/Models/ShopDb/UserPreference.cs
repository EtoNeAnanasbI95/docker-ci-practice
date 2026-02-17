using System;
using System.Text.Json.Serialization;

namespace Models.ShopDb;

public partial class UserPreference
{
    public long UserId { get; set; }

    public string Theme { get; set; } = null!;

    public DateTime UpdatedAt { get; set; }

    [JsonIgnore] public virtual User User { get; set; } = null!;
}
