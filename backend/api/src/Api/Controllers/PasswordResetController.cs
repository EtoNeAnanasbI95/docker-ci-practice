using System;
using System.Linq;
using Api.DTOs;
using Api.Services;
using BCryptNet = BCrypt.Net.BCrypt;
using Data.ShopDb;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class PasswordResetController(AppDbContext context, ITelegramMessenger messenger, ILogger<PasswordResetController> logger) : ControllerBase
{
    [HttpPost("request")]
    public async Task<ActionResult<object>> RequestReset(PasswordResetRequestDto dto)
    {
        var lookup = dto.LoginOrTelegram.Trim().TrimStart('@');
        var user = await context.Users
            .Where(u => !u.IsDeleted && (u.Login == lookup || u.TelegramUsername == lookup))
            .Select(u => new
            {
                u.Id,
                u.Login,
                u.TelegramChatId
            })
            .FirstOrDefaultAsync();

        if (user == null)
        {
            return NotFound("User not found");
        }

        var token = await context.Database
            .SqlQueryRaw<Guid>("SELECT request_password_reset({0}) AS \"Value\"", user.Id)
            .SingleAsync();

        var sent = false;
        if (user.TelegramChatId.HasValue)
        {
            try
            {
                await messenger.SendPasswordResetTokenAsync(user.TelegramChatId.Value, token);
                sent = true;
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to send password reset token to telegram for user {Login}", user.Login);
            }
        }

        return Ok(new { token, sent });
    }

    [HttpPost("complete")]
    public async Task<IActionResult> CompleteReset(PasswordResetCompleteDto dto)
    {
        var now = CurrentTimestamp();
        var token = await context.PasswordResetTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Token == dto.Token);

        if (token == null || token.User == null)
        {
            return BadRequest("Токен не найден");
        }

        if (token.IsRevoked || token.ConsumedAt != null)
        {
            return BadRequest("Токен уже использован или отозван");
        }

        if (token.ExpiresAt <= now)
        {
            return BadRequest("Срок действия токена истёк");
        }

        token.User.Password = BCryptNet.HashPassword(dto.NewPassword);
        token.ConsumedAt = now;
        token.IsRevoked = true;

        await context.SaveChangesAsync();

        return NoContent();
    }

    [HttpGet("status/{token:guid}")]
    public async Task<ActionResult<object>> GetTokenStatus(Guid token)
    {
        var isActive = await context.Database
            .SqlQueryRaw<bool>("SELECT is_password_reset_token_active({0})", token)
            .FirstAsync();

        var metadata = await context.PasswordResetTokens
            .Where(t => t.Token == token)
            .Select(t => new
            {
                t.ExpiresAt,
                t.ConsumedAt,
                t.IsRevoked
            })
            .FirstOrDefaultAsync();

        return Ok(new
        {
            token,
            isActive,
            expiresAt = metadata?.ExpiresAt,
            consumedAt = metadata?.ConsumedAt,
            isRevoked = metadata?.IsRevoked ?? false
        });
    }

    private static DateTime CurrentTimestamp()
    {
        return DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);
    }
}
