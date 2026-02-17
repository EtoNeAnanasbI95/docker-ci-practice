namespace Api.Options;

public class RegistrationOptions
{
    public string BotSecret { get; set; } = string.Empty;

    public string DefaultRoleName { get; set; } = "customer";

    public int VerificationCodeTtlMinutes { get; set; } = 15;
}
