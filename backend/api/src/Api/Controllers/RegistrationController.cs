using System;
using System.Linq;
using System.Threading.Tasks;
using Api.DTOs;
using Api.Options;
using Api.Services;
using BCryptNet = BCrypt.Net.BCrypt;
using Data.ShopDb;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Models.ShopDb;

namespace Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class RegistrationController(
    AppDbContext context,
    ITelegramMessenger messenger,
    IOptions<RegistrationOptions> options,
    ILogger<RegistrationController> logger) : ControllerBase
{
    [HttpPost("request")]
    public new async Task<ActionResult<RegistrationRequestResponseDto>> Request(RegistrationRequestDto dto)
    {
        var login = dto.Login.Trim();
        var normalizedLogin = login.ToLowerInvariant();

        if (await context.Users.AnyAsync(u => u.Login.ToLower() == normalizedLogin && !u.IsDeleted))
        {
            return Conflict("Пользователь с таким логином уже существует");
        }

        var now = CurrentTimestamp();
        var existingPendings = await context.PendingRegistrations
            .Where(p => p.Login.ToLower() == normalizedLogin)
            .ToListAsync();

        var activePending = existingPendings
            .FirstOrDefault(p => p.ConsumedAt == null && p.ExpiresAt > now);
        if (activePending != null)
        {
            return Ok(new RegistrationRequestResponseDto
            {
                RegistrationId = activePending.Id,
                ExpiresAt = activePending.ExpiresAt
            });
        }

        // Удаляем устаревшие или завершённые записи, чтобы не упереться в UNIQUE(login)
        var stalePendings = existingPendings
            .Where(p => p.ConsumedAt != null || p.ExpiresAt <= now)
            .ToList();
        if (stalePendings.Count > 0)
        {
            context.PendingRegistrations.RemoveRange(stalePendings);
            await context.SaveChangesAsync();
        }

        var defaultRoleId = await ResolveDefaultRoleId();
        var normalizedTag = NormalizeTelegramTag(dto.TelegramUsername);
        if (string.IsNullOrWhiteSpace(normalizedTag))
        {
            return BadRequest("Укажите корректный Telegram username");
        }

        var pending = new PendingRegistration
        {
            Id = Guid.NewGuid(),
            Login = login,
            PasswordHash = BCryptNet.HashPassword(dto.Password),
            FullName = dto.FullName.Trim(),
            TelegramUsername = normalizedTag,
            VerificationCode = GenerateVerificationCode(),
            CreatedAt = now,
            ExpiresAt = now.AddMinutes(options.Value.VerificationCodeTtlMinutes),
            RoleId = defaultRoleId
        };

        context.PendingRegistrations.Add(pending);
        await context.SaveChangesAsync();

        logger.LogInformation("Pending registration created for login {Login}", login);

        return Ok(new RegistrationRequestResponseDto
        {
            RegistrationId = pending.Id,
            ExpiresAt = pending.ExpiresAt
        });
    }

    [HttpPost("resend")]
    public async Task<ActionResult<object>> Resend(RegistrationResendDto dto)
    {
        var pending = await context.PendingRegistrations.FirstOrDefaultAsync(p => p.Id == dto.RegistrationId && p.ConsumedAt == null);
        if (pending == null)
        {
            return NotFound("Регистрация не найдена");
        }

        if (!pending.TelegramChatId.HasValue)
        {
            return BadRequest("Чат Telegram ещё не связан. Напишите боту по ссылке из магазина.");
        }

        pending.VerificationCode = GenerateVerificationCode();
        pending.ExpiresAt = CurrentTimestamp()
            .AddMinutes(options.Value.VerificationCodeTtlMinutes);

        await context.SaveChangesAsync();
        await messenger.SendVerificationMessageAsync(pending.TelegramChatId.Value, pending.VerificationCode);

        return Ok(new
        {
            expiresAt = pending.ExpiresAt
        });
    }

    [HttpPost("confirm")]
    public async Task<IActionResult> Confirm(RegistrationConfirmDto dto)
    {
        var pending = await context.PendingRegistrations.FirstOrDefaultAsync(p => p.Id == dto.RegistrationId && p.ConsumedAt == null);
        if (pending == null)
        {
            return NotFound("Регистрация не найдена");
        }

        var now = CurrentTimestamp();
        if (pending.ExpiresAt <= now)
        {
            return BadRequest("Срок действия кода истёк. Запросите новый код.");
        }

        if (!pending.TelegramChatId.HasValue)
        {
            return BadRequest("Telegram ещё не привязан. Напишите нашему боту и повторите попытку.");
        }

        if (!string.Equals(pending.VerificationCode, dto.Code.Trim(), StringComparison.Ordinal))
        {
            return BadRequest("Неверный код подтверждения");
        }

        var normalizedLogin = pending.Login.ToLowerInvariant();
        var existingDeletedUser = await context.Users.FirstOrDefaultAsync(u => u.Login.ToLower() == normalizedLogin && u.IsDeleted);
        User user;
        if (existingDeletedUser != null)
        {
            // Реактивация логически удалённого пользователя
            existingDeletedUser.Password = pending.PasswordHash;
            existingDeletedUser.FullName = pending.FullName;
            existingDeletedUser.TelegramUsername = pending.TelegramUsername;
            existingDeletedUser.TelegramChatId = pending.TelegramChatId;
            existingDeletedUser.TelegramVerified = true;
            existingDeletedUser.RoleId = pending.RoleId;
            existingDeletedUser.IsArchived = false;
            existingDeletedUser.IsDeleted = false;
            existingDeletedUser.CreationDatetime = now;
            user = existingDeletedUser;
        }
        else
        {
            user = new User
            {
                Login = pending.Login,
                Password = pending.PasswordHash,
                FullName = pending.FullName,
                TelegramUsername = pending.TelegramUsername,
                TelegramChatId = pending.TelegramChatId,
                TelegramVerified = true,
                RoleId = pending.RoleId,
                CreationDatetime = now,
                IsArchived = false,
                IsDeleted = false
            };

            context.Users.Add(user);
        }
        pending.ConsumedAt = now;
        context.PendingRegistrations.Remove(pending);

        await context.SaveChangesAsync();
        logger.LogInformation("User {Login} created after Telegram confirmation", user.Login);

        return Ok(new { userId = user.Id });
    }

    [HttpPost("bot/start")]
    public async Task<ActionResult<object>> BotStart(
        RegistrationBotStartDto dto,
        [FromHeader(Name = "X-Registration-Secret")] string? secret)
    {
        if (!string.IsNullOrEmpty(options.Value.BotSecret))
        {
            if (string.IsNullOrEmpty(secret) || secret != options.Value.BotSecret)
            {
                return Unauthorized("Недействительный секрет");
            }
        }

        var pending = await context.PendingRegistrations.FirstOrDefaultAsync(p => p.Id == dto.RegistrationId && p.ConsumedAt == null);
        if (pending == null)
        {
            return NotFound("Регистрация не найдена");
        }

        pending.TelegramChatId = dto.ChatId;
        pending.VerificationCode = GenerateVerificationCode();
        pending.ExpiresAt = CurrentTimestamp()
            .AddMinutes(options.Value.VerificationCodeTtlMinutes);

        await context.SaveChangesAsync();

        return Ok(new
        {
            code = pending.VerificationCode,
            expiresAt = pending.ExpiresAt
        });
    }

    private async Task<long> ResolveDefaultRoleId()
    {
        var roleName = options.Value.DefaultRoleName;
        var role = await context.Roles.FirstOrDefaultAsync(r => r.Name == roleName);
        if (role == null)
        {
            throw new InvalidOperationException($"Роль {roleName} не найдена");
        }

        return role.Id;
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

    private static string GenerateVerificationCode()
    {
        var random = new Random();
        return random.Next(100000, 999999).ToString();
    }

    private static DateTime CurrentTimestamp()
    {
        return DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);
    }
}
