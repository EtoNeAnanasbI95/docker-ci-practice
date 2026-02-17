using System.Diagnostics;
using System.Text.RegularExpressions;
using Data.ShopDb;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Api.Services;

public class DatabaseDumpOptions
{
    public string PgDumpPath { get; set; } = "pg_dump";
    public string PsqlPath { get; set; } = "psql";
}

public interface IDatabaseDumpService
{
    Task<Stream> CreateDumpAsync(CancellationToken cancellationToken = default);
    Task RestoreDumpAsync(Stream dumpStream, CancellationToken cancellationToken = default);
}

public class DatabaseDumpService : IDatabaseDumpService
{
    private readonly IDbContextFactory<AppDbContext> _contextFactory;
    private readonly ILogger<DatabaseDumpService> _logger;
    private readonly string _pgDumpPath;
    private readonly string _psqlPath;

    private static readonly Regex ConnectionRegex =
        new(
            @"Host=(?<host>[^;]+);Port=(?<port>[^;]+);Database=(?<db>[^;]+);Username=(?<user>[^;]+);Password=(?<password>[^;]+);?",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

    public DatabaseDumpService(
        IDbContextFactory<AppDbContext> contextFactory,
        ILogger<DatabaseDumpService> logger,
        IOptions<DatabaseDumpOptions> options)
    {
        _contextFactory = contextFactory;
        _logger = logger;
        _pgDumpPath = options.Value.PgDumpPath;
        _psqlPath = options.Value.PsqlPath;
    }

    public async Task<Stream> CreateDumpAsync(CancellationToken cancellationToken = default)
    {
        await using var context = await _contextFactory.CreateDbContextAsync(cancellationToken);
        var connection = context.Database.GetDbConnection().ConnectionString;
        var match = ConnectionRegex.Match(connection);

        if (!match.Success)
        {
            throw new InvalidOperationException("Не удалось разобрать строку подключения для pg_dump");
        }

        var host = match.Groups["host"].Value;
        var port = match.Groups["port"].Value;
        var database = match.Groups["db"].Value;
        var user = match.Groups["user"].Value;
        var password = match.Groups["password"].Value;

        var startInfo = new ProcessStartInfo
        {
            FileName = _pgDumpPath,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
            ArgumentList =
            {
                "-h", host,
                "-p", port,
                "-U", user,
                "-d", database
            }
        };

        startInfo.Environment["PGPASSWORD"] = password;

        try
        {
            var process = Process.Start(startInfo);
            if (process == null)
            {
                throw new InvalidOperationException("Не удалось запустить pg_dump");
            }

            var outputStream = new MemoryStream();
            await process.StandardOutput.BaseStream.CopyToAsync(outputStream, cancellationToken);
            var errors = await process.StandardError.ReadToEndAsync(cancellationToken);
            await process.WaitForExitAsync(cancellationToken);

            if (process.ExitCode != 0)
            {
                _logger.LogError("pg_dump завершился с кодом {ExitCode} и ошибкой: {Error}", process.ExitCode, errors);
                throw new InvalidOperationException("Не удалось выполнить pg_dump. Проверьте лог сервера.");
            }

            outputStream.Position = 0;
            return outputStream;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при попытке сделать pg_dump");
            throw;
        }
    }

    public async Task RestoreDumpAsync(Stream dumpStream, CancellationToken cancellationToken = default)
    {
        await using var context = await _contextFactory.CreateDbContextAsync(cancellationToken);
        var connection = context.Database.GetDbConnection().ConnectionString;
        var match = ConnectionRegex.Match(connection);

        if (!match.Success)
        {
            throw new InvalidOperationException("Не удалось разобрать строку подключения для psql");
        }

        var host = match.Groups["host"].Value;
        var port = match.Groups["port"].Value;
        var database = match.Groups["db"].Value;
        var user = match.Groups["user"].Value;
        var password = match.Groups["password"].Value;

        var tempFile = Path.GetTempFileName();
        try
        {
            await using (var fileStream = File.Create(tempFile))
            {
                dumpStream.Position = 0;
                await dumpStream.CopyToAsync(fileStream, cancellationToken);
            }

            var startInfo = new ProcessStartInfo
            {
                FileName = _psqlPath,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
                ArgumentList =
                {
                    "-h", host,
                    "-p", port,
                    "-U", user,
                    "-d", database,
                    "-f", tempFile
                }
            };

            startInfo.Environment["PGPASSWORD"] = password;

            var process = Process.Start(startInfo);
            if (process == null)
            {
                throw new InvalidOperationException("Не удалось запустить psql для восстановления");
            }

            var errors = await process.StandardError.ReadToEndAsync(cancellationToken);
            var output = await process.StandardOutput.ReadToEndAsync(cancellationToken);
            await process.WaitForExitAsync(cancellationToken);

            if (process.ExitCode != 0)
            {
                _logger.LogError("psql завершился с кодом {ExitCode}. Output: {Output}. Error: {Error}",
                    process.ExitCode, output, errors);
                throw new InvalidOperationException("Ошибка восстановления БД. Проверьте лог сервера.");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при восстановлении из SQL дампа");
            throw;
        }
        finally
        {
            try
            {
                if (File.Exists(tempFile))
                {
                    File.Delete(tempFile);
                }
            }
            catch (Exception cleanupEx)
            {
                _logger.LogWarning(cleanupEx, "Не удалось удалить временный файл дампа {TempFile}", tempFile);
            }
        }
    }
}
