using Api.DTOs;
using Data.ShopDb;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models.ShopDb;

namespace Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class UserPreferencesController(AppDbContext context) : ControllerBase
{
    [HttpGet("{userId:long}")]
    public async Task<ActionResult<UserPreference>> Get(long userId)
    {
        var preference = await context.UserPreferences.FindAsync(userId);
        if (preference != null)
        {
            return preference;
        }

        var userExists = await context.Users.AnyAsync(u => u.Id == userId && !u.IsDeleted);
        if (!userExists)
        {
            return NotFound("User not found");
        }

        preference = new UserPreference
        {
            UserId = userId,
            Theme = "light",
            UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified)
        };
        context.UserPreferences.Add(preference);
        await context.SaveChangesAsync();

        return preference;
    }

    [HttpPut("{userId:long}")]
    public async Task<ActionResult<UserPreference>> Upsert(long userId, UserPreferenceDto dto)
    {
        if (userId != dto.UserId)
        {
            return BadRequest("UserId mismatch");
        }

        var userExists = await context.Users.AnyAsync(u => u.Id == userId && !u.IsDeleted);
        if (!userExists)
        {
            return NotFound("User not found");
        }

        var preference = await context.UserPreferences.FindAsync(userId);
        if (preference == null)
        {
            preference = new UserPreference
            {
                UserId = userId,
                Theme = dto.Theme,
                UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified)
            };
            context.UserPreferences.Add(preference);
        }
        else
        {
            preference.Theme = dto.Theme;
            preference.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);
        }

        await context.SaveChangesAsync();

        return Ok(preference);
    }
}
