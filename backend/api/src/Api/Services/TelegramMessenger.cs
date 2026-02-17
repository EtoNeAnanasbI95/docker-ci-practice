using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading;
using System.Threading.Tasks;
using Api.Options;
using Microsoft.Extensions.Options;

namespace Api.Services;

public interface ITelegramMessenger
{
    Task SendVerificationMessageAsync(long chatId, string code, CancellationToken cancellationToken = default);

    Task SendPasswordResetTokenAsync(long chatId, Guid token, CancellationToken cancellationToken = default);
}

public class TelegramMessenger(HttpClient httpClient, IOptions<TelegramOptions> options) : ITelegramMessenger
{
    private readonly HttpClient _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
    private readonly TelegramOptions _options = options.Value;

    public async Task SendVerificationMessageAsync(long chatId, string code, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_options.BotToken) || chatId == 0 || string.IsNullOrWhiteSpace(code))
        {
            return;
        }

        var text = string.IsNullOrWhiteSpace(_options.VerificationTemplate)
            ? $"Код подтверждения: {code}"
            : _options.VerificationTemplate.Replace("{code}", code);

        await SendMessageAsync(chatId, text, cancellationToken);
    }

    public async Task SendPasswordResetTokenAsync(long chatId, Guid token, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_options.BotToken) || chatId == 0 || token == Guid.Empty)
        {
            return;
        }

        var text = string.IsNullOrWhiteSpace(_options.PasswordResetTemplate)
            ? $"Токен для сброса пароля: {token}"
            : _options.PasswordResetTemplate.Replace("{token}", token.ToString());

        await SendMessageAsync(chatId, text, cancellationToken);
    }

    private async Task SendMessageAsync(long chatId, string text, CancellationToken cancellationToken)
    {
        var payload = new
        {
            chat_id = chatId,
            text,
            parse_mode = "HTML"
        };

        using var response = await _httpClient.PostAsJsonAsync("sendMessage", payload, cancellationToken);
        response.EnsureSuccessStatusCode();
    }
}
