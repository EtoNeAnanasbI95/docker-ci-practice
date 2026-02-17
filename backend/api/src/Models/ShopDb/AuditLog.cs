using System;
using System.Collections.Generic;

namespace Models.ShopDb;

public partial class AuditLog
{
    public long Id { get; set; }

    public long UserId { get; set; }

    public DateTime OperationTime { get; set; }

    public string TableName { get; set; } = null!;

    public string OldData { get; set; } = null!;

    public string NewData { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
