using Api.Middlewares;
using Api.Monitoring;
using Api.Services;
using Api.Options;
using Api.Filters;
using Data.ShopDb;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Prometheus;
using Serilog;
using Serilog.Events;
using Microsoft.Extensions.Options;

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Debug()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Information)
    .MinimumLevel.Override("Microsoft.Hosting.Lifetime", LogEventLevel.Information)
    .MinimumLevel.Override("System", LogEventLevel.Warning)
    .WriteTo.Console(outputTemplate: "{Timestamp:HH:mm:ss} [{Level}] {SourceContext}: {Message}{NewLine}{Exception}")
    .WriteTo.File("Logs/log-.txt",
        rollingInterval: RollingInterval.Day,
        outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss} [{Level}] {SourceContext}: {Message}{NewLine}{Exception}")
    .CreateLogger();


var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog(Log.Logger);

var connectionString = builder.Configuration.GetConnectionString("AppDbContext");

void ConfigureDbContext(DbContextOptionsBuilder options)
{
    options.UseNpgsql(connectionString,
        npgsqlOptions => npgsqlOptions.EnableRetryOnFailure(
            maxRetryCount: 3,
            maxRetryDelay: TimeSpan.FromSeconds(30),
            errorCodesToAdd: null));
}

builder.Services.AddDbContext<AppDbContext>(ConfigureDbContext);
builder.Services.AddDbContextFactory<AppDbContext>(ConfigureDbContext, ServiceLifetime.Scoped);

builder.Services.AddControllers(options =>
{
    options.Filters.Add<AuditUserFilter>();
});
builder.Services.AddHostedService<ShopMetricsCollector>();
builder.Services.AddHostedService<TelegrafPushService>();
builder.Services.Configure<DatabaseDumpOptions>(builder.Configuration.GetSection("DatabaseDump"));
builder.Services.Configure<TelegramOptions>(builder.Configuration.GetSection("Telegram"));
builder.Services.Configure<RegistrationOptions>(builder.Configuration.GetSection("Registration"));
builder.Services.Configure<TelegrafOptions>(builder.Configuration.GetSection("Telegraf"));
builder.Services.AddScoped<IDatabaseDumpService, DatabaseDumpService>();
builder.Services.AddHttpClient<ITelegramMessenger, TelegramMessenger>((sp, client) =>
{
    var options = sp.GetRequiredService<IOptions<TelegramOptions>>().Value;
    if (!string.IsNullOrWhiteSpace(options.BotToken))
    {
        client.BaseAddress = new Uri($"https://api.telegram.org/bot{options.BotToken}/");
    }
});

// CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader()
            .SetPreflightMaxAge(TimeSpan.FromSeconds(86400)); // 24 часа кэш
    });
});

// SWAGGER
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Shop Management API",
        Version = "v1",
        Description = "API для управления магазином",
        Contact = new Microsoft.OpenApi.Models.OpenApiContact
        {
            Name = "Shop Management Team",
            Email = "admin@shop.com"
        }
    });

    // Include XML comments if available
    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        c.IncludeXmlComments(xmlPath);
    }
});

builder.Logging.AddFilter("Microsoft.EntityFrameworkCore", LogLevel.Warning);

builder.Logging.AddFilter("Microsoft.EntityFrameworkCore.Database.Command", LogLevel.None);

var app = builder.Build();

app.UseMiddleware<ExceptionMiddleware>();

// SWAGGER
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Shop Management API v1");
    c.RoutePrefix = "swagger";
    c.DisplayRequestDuration();
    c.EnableDeepLinking();
    c.EnableFilter();
    c.ShowExtensions();
});

// ROUTING
app.UseRouting();
app.UseCors();
app.UseHttpMetrics();
app.UseHttpsRedirection();
app.MapControllers();
app.MapMetrics("/metrics");
app.MapGet("/", () => Results.Redirect("/swagger"));

app.Run();
