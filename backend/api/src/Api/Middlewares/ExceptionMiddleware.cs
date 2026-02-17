namespace Api.Middlewares;

using Microsoft.AspNetCore.Http;
using ILogger = Serilog.ILogger;

/// <summary>
///     Обработчик ошибок вместе с логированием
/// </summary>
public class ExceptionMiddleware(RequestDelegate next, ILogger logger)
{
  public async Task InvokeAsync(HttpContext context)
  {
    try
    {
      await next(context);
    }
    catch (Exception ex)
    {
      logger.Error("Ошибка запроса {Path}: {Message}",
        context.Request.Path,
        ex.Message);
      logger.Error("Exception stack trace: {StackTrace}", ex);

      await HandleExceptionAsync(context, ex);
    }
  }

  private static Task HandleExceptionAsync(HttpContext context, Exception exception)
  {
    var result = exception switch
    {
      ArgumentNullException argNullEx => new
      {
        StatusCode = StatusCodes.Status400BadRequest,
        argNullEx.Message,
        Details = "Required parameter is missing"
      },
      ArgumentException argEx => new
      {
        StatusCode = StatusCodes.Status400BadRequest,
        argEx.Message,
        Details = "Invalid data format"
      },
      UnauthorizedAccessException authEx => new
      {
        StatusCode = StatusCodes.Status403Forbidden,
        authEx.Message,
        Details = "No access to resource"
      },
      _ => new
      {
        StatusCode = StatusCodes.Status500InternalServerError,
        exception.Message,
        Details = "Internal server error"
      }
    };

    context.Response.StatusCode = result.StatusCode;
    context.Response.ContentType = "application/json";

    return context.Response.WriteAsJsonAsync(result);
  }
}
