namespace Api.Options;

public class TelegramOptions
{
    public string BotToken { get; set; } = string.Empty;

    public string VerificationTemplate { get; set; } = "Ваш код подтверждения: {code}";

    public string PasswordResetTemplate { get; set; } = "Токен для сброса пароля: {token}";
}
