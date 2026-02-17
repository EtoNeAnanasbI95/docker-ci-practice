using System;
using Api.DTOs;
using BCryptNet = BCrypt.Net.BCrypt;
using Data.ShopDb;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models.ShopDb;

namespace Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class UserController(AppDbContext context, ILogger<UserController> logger) : ControllerBase
{
    // GET: api/User
    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetUsers()
    {
        logger.LogInformation("Fetching active users");
        var users = await context.Users
            .Where(u => !u.IsDeleted)
            .Include(u => u.Role)
            .AsNoTracking()
            .ToListAsync();

        var userDtos = users.Select(MapToDto).ToList();
        logger.LogInformation("Returning {Count} users", users.Count);
        return userDtos;
    }

    // GET: api/User/5
    [HttpGet("{id}")]
    public async Task<ActionResult<UserDto>> GetUser(long id)
    {
        logger.LogInformation("Fetching user {UserId}", id);
        var user = await context.Users
            .Where(u => u.Id == id && !u.IsDeleted)
            .Include(u => u.Role)
            .AsNoTracking()
            .FirstOrDefaultAsync();

        if (user == null)
        {
            logger.LogWarning("User {UserId} not found", id);
            return NotFound();
        }

        return MapToDto(user);
    }

    // PUT: api/User/5
    [HttpPut("{id}")]
    public async Task<IActionResult> PutUser(long id, UserUpdateDto userDto)
    {
        if (id != userDto.Id)
        {
            return BadRequest();
        }

        var existingUser = await context.Users.FindAsync(id);
        if (existingUser == null || existingUser.IsDeleted)
        {
            logger.LogWarning("Attempt to update missing user {UserId}", id);
            return NotFound();
        }

        var normalizedUsername = NormalizeTelegramTag(userDto.TelegramUsername);
        var usernameChanged = !string.Equals(existingUser.TelegramUsername, normalizedUsername, StringComparison.OrdinalIgnoreCase);

        existingUser.Login = userDto.Login;
        existingUser.TelegramUsername = normalizedUsername;
        existingUser.TelegramChatId = userDto.TelegramChatId;
        existingUser.RoleId = userDto.RoleId;
        existingUser.FullName = userDto.FullName.Trim();
        existingUser.IsArchived = userDto.IsArchived;
        existingUser.UpdateDatetime = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);
        if (usernameChanged)
        {
            existingUser.TelegramVerified = false;
        }

        try
        {
            await context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!UserExists(id))
            {
                logger.LogWarning("Concurrency conflict updating user {UserId}", id);
                return NotFound();
            }
            throw;
        }

        logger.LogInformation("User {UserId} updated", id);
        return NoContent();
    }

    // POST: api/User
    [HttpPost]
    public async Task<ActionResult<UserDto>> PostUser(UserCreateDto userDto)
    {
        logger.LogInformation("Creating new user {Login}", userDto.Login);
        var user = new User
        {
            Login = userDto.Login,
            TelegramUsername = NormalizeTelegramTag(userDto.TelegramUsername),
            TelegramChatId = userDto.TelegramChatId,
            TelegramVerified = false,
            Password = BCryptNet.HashPassword(userDto.Password),
            RoleId = userDto.RoleId,
            FullName = userDto.FullName.Trim(),
            IsDeleted = false,
            IsArchived = false,
            CreationDatetime = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified)
        };

        context.Users.Add(user);
        await context.SaveChangesAsync();

        await context.Entry(user).Reference(u => u.Role).LoadAsync();

        logger.LogInformation("User {UserId} created", user.Id);
        return CreatedAtAction(nameof(GetUser), new { id = user.Id }, MapToDto(user));
    }

    // DELETE: api/User/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUser(long id)
    {
        var user = await context.Users.FindAsync(id);
        if (user == null)
        {
            logger.LogWarning("Attempt to delete missing user {UserId}", id);
            return NotFound();
        }

        user.IsDeleted = true;
        await context.SaveChangesAsync();

        logger.LogInformation("User {UserId} soft deleted", id);
        return NoContent();
    }

    private static UserDto MapToDto(User user) => new()
    {
        Id = user.Id,
        Login = user.Login,
        TelegramUsername = user.TelegramUsername,
        TelegramChatId = user.TelegramChatId,
        TelegramVerified = user.TelegramVerified,
        RoleId = user.RoleId,
        FullName = user.FullName ?? string.Empty,
        CreationDatetime = user.CreationDatetime,
        UpdateDatetime = user.UpdateDatetime,
        LastLoginAt = user.LastLoginAt,
        IsArchived = user.IsArchived,
        IsDeleted = user.IsDeleted,
        Role = user.Role == null
            ? null
            : new RoleDto
            {
                Id = user.Role.Id,
                Name = user.Role.Name,
                CreatedAt = user.Role.CreatedAt
            }
    };

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

    private bool UserExists(long id)
    {
        return context.Users.Any(e => e.Id == id && !e.IsDeleted);
    }
}
