using System;
using System.Linq;
using System.Security.Cryptography;
using System.Threading.Tasks;
using Api.DTOs;
using Api.Services;
using Data.ShopDb;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class TelegramVerificationController(AppDbContext context, ITelegramMessenger messenger, ILogger<TelegramVerificationController> logger) : ControllerBase
{
    [HttpPost("request")]
    public async Task<ActionResult<object>> RequestVerification(TelegramVerificationRequestDto dto)
    {
        var user = await context.Users.FirstOrDefaultAsync(u => u.Id == dto.UserId && !u.IsDeleted);
        if (user == null)
        {
            logger.LogWarning("User {UserId} not found for telegram verification request", dto.UserId);
            return NotFound("Пользователь не найден");
        }

        return await ProcessVerification(user, dto.TelegramUsername, dto.TelegramChatId);
    }

    [HttpPost("request/by-login")]
    public async Task<ActionResult<object>> RequestVerificationByLogin(TelegramVerificationByLoginRequestDto dto)
    {
        var user = await context.Users
            .FirstOrDefaultAsync(u => u.Login == dto.Login && !u.IsDeleted);

        if (user == null)
        {
            logger.LogWarning("Login {Login} not found for telegram verification request", dto.Login);
            return NotFound("Пользователь не найден");
        }

        var username = string.IsNullOrWhiteSpace(dto.TelegramUsername)
            ? user.TelegramUsername ?? dto.Login
            : dto.TelegramUsername;

        return await ProcessVerification(user, username, dto.TelegramChatId);
    }

    [HttpPost("confirm")]
    public async Task<IActionResult> ConfirmVerification(TelegramVerificationConfirmDto dto)
    {
        var now = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);
        var code = dto.Code.Trim();

        var token = await context.TelegramVerificationTokens
            .Include(t => t.User)
            .Where(t => t.UserId == dto.UserId && t.Code == code)
            .OrderByDescending(t => t.CreatedAt)
            .FirstOrDefaultAsync();

        if (token == null || token.ExpiresAt <= now || token.ConfirmedAt != null)
        {
            return BadRequest("Код не найден или просрочен");
        }

        if (token.User == null)
        {
            return BadRequest("Пользователь не найден");
        }

        token.ConfirmedAt = now;
        token.User.TelegramVerified = true;

        await context.SaveChangesAsync();

        return NoContent();
    }

    private static string GenerateCode()
    {
        var value = RandomNumberGenerator.GetInt32(100000, 999999);
        return value.ToString();
    }

    private async Task<ActionResult<object>> ProcessVerification(Models.ShopDb.User user, string? telegramUsername, long? chatId)
    {
        var normalizedUsername = NormalizeTelegramTag(telegramUsername ?? user.TelegramUsername ?? user.Login);
        if (string.IsNullOrWhiteSpace(normalizedUsername))
        {
            return BadRequest("Не удалось определить тег Telegram");
        }

        user.TelegramUsername = normalizedUsername;
        if (chatId.HasValue)
        {
            user.TelegramChatId = chatId;
        }
        user.TelegramVerified = false;

        var now = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);
        var token = new Models.ShopDb.TelegramVerificationToken
        {
            UserId = user.Id,
            Code = GenerateCode(),
            ExpiresAt = now.AddMinutes(10),
            CreatedAt = now
        };

        context.TelegramVerificationTokens.Add(token);
        await context.SaveChangesAsync();

        var targetChatId = user.TelegramChatId;
        var sent = false;
        if (targetChatId.HasValue)
        {
            await messenger.SendVerificationMessageAsync(targetChatId.Value, token.Code);
            sent = true;
        }

        return Ok(new
        {
            tokenId = token.Id,
            token.ExpiresAt,
            sent
        });
    }

    private static string NormalizeTelegramTag(string tag)
    {
        if (string.IsNullOrWhiteSpace(tag))
        {
            return string.Empty;
        }

        var normalized = tag.Trim();
        return normalized.StartsWith("@", StringComparison.Ordinal)
            ? normalized[1..]
            : normalized;
    }
}
