namespace Api.Options;

public class TelegrafOptions
{
    /// <summary>
    /// Включить отправку метрик напрямую в Telegraf.
    /// </summary>
    public bool Enabled { get; set; } = false;

    /// <summary>
    /// Адрес HTTP listener'а telegraf (inputs.http_listener_v2), например http://localhost:8186/telegraf
    /// </summary>
    public string Url { get; set; } = "http://91.222.236.132:8186/telegraf";

    /// <summary>
    /// Период обновления метрик, секунд.
    /// </summary>
    public int IntervalSeconds { get; set; } = 30;
}
