using Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class DatabaseController(IDatabaseDumpService dumpService, ILogger<DatabaseController> logger)
    : ControllerBase
{
    [HttpGet("backup")]
    public async Task<IActionResult> DownloadBackup(CancellationToken cancellationToken)
    {
        try
        {
            var stream = await dumpService.CreateDumpAsync(cancellationToken);
            var fileName = $"pg-dump-{DateTime.UtcNow:yyyyMMddHHmmss}.sql";
            return File(stream, "application/sql", fileName);
        }
        catch (InvalidOperationException ex)
        {
            logger.LogError(ex, "Ошибка при создании SQL дампа");
            return StatusCode(StatusCodes.Status500InternalServerError,
                "Не удалось сформировать дамп базы данных. Проверьте настройки pg_dump.");
        }
    }

    [HttpPost("restore")]
    [RequestSizeLimit(100 * 1024 * 1024)]
    public async Task<IActionResult> RestoreBackup([FromForm] IFormFile? file, CancellationToken cancellationToken)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest("Файл с SQL дампом не загружен");
        }

        await using var memoryStream = new MemoryStream();
        await file.CopyToAsync(memoryStream, cancellationToken);
        memoryStream.Position = 0;

        try
        {
            await dumpService.RestoreDumpAsync(memoryStream, cancellationToken);
            return Ok(new { message = "База данных восстановлена из SQL дампа" });
        }
        catch (InvalidOperationException ex)
        {
            logger.LogError(ex, "Ошибка восстановления из SQL дампа");
            return StatusCode(StatusCodes.Status500InternalServerError,
                "Не удалось восстановить БД. Проверьте корректность SQL файла.");
        }
    }
}
