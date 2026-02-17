using System.Threading.Tasks;
using Data.ShopDb;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Api.Filters;

/// <summary>
/// Перед выполнением небезопасных действий устанавливает app.current_user_id для триггеров аудита.
/// Берёт userId из заголовка X-User-Id, иначе использует системный id=1.
/// </summary>
public class AuditUserFilter(AppDbContext context, ILogger<AuditUserFilter> logger) : IAsyncActionFilter
{
    private const long SystemUserId = 1;

    public async Task OnActionExecutionAsync(ActionExecutingContext contextFilter, ActionExecutionDelegate next)
    {
        var method = contextFilter.HttpContext.Request.Method.ToUpperInvariant();
        if (method is "GET" or "HEAD" or "OPTIONS")
        {
            await next();
            return;
        }

        var headers = contextFilter.HttpContext.Request.Headers;
        var userId = SystemUserId;

        if (headers.TryGetValue("X-User-Id", out var raw) && long.TryParse(raw, out var parsed) && parsed > 0)
        {
            userId = parsed;
        }

        try
        {
            await context.Database.ExecuteSqlRawAsync("SELECT set_current_user_id({0})", userId);
        }
        catch (DbUpdateException ex)
        {
            logger.LogWarning(ex, "Не удалось установить текущего пользователя для аудита (id={UserId})", userId);
        }

        await next();
    }
}
