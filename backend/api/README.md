# Backend API (.NET 9)

REST API для магазина стульев. Используется фронтендами **shop** и **adminer**.  
Работает поверх PostgreSQL и использует представления/процедуры из `DB/script.sql`.

## Требования
- .NET SDK 9.x
- PostgreSQL 15+
- Применённые SQL-скрипты `DB/master.sql`, `DB/init.sql`, `DB/script.sql`, `DB/inserts.sql`

## Конфигурация
Основные настройки лежат в `src/Api/appsettings.json`. Минимальный набор:

```json
"ConnectionStrings": {
  "AppDbContext": "Host=localhost;Port=5432;Database=coursework_db;Username=admin;Password=secret;"
},
"DatabaseDump": {
  "PgDumpPath": "pg_dump",
  "PsqlPath": "psql"
}
```

Запускайте локально через:
```bash
cd backend/api
dotnet restore
dotnet run --project src/Api/Api.csproj
```

Приложение по умолчанию слушает `http://localhost:5000`.

## Swagger
После запуска Swagger доступен по `http://localhost:5000/swagger`.  
Новые контроллеры/DTO (`AnalyticsController`, `ProductInventoryView` и т.д.) описаны автоматически.

## Ключевые эндпоинты
- `GET /api/Product/catalog` — публичный каталог на основе `v_product_inventory`.
- `GET /api/Analytics/dashboard` — агрегированная статистика (выручка, заказы, низкие остатки, топ клиентов) из представлений `v_product_inventory` и `v_user_orders_summary`.
- CRUD для брендов, материалов, товаров, заказов, статусов и т.д.
- `POST /api/UserPreferences` / `PUT` — используют процедуру `upsert_user_preferences`.
- `POST /api/Orders/with-details` *(при необходимости добавить)* — должна вызывать `create_order_with_details`.
- `GET /api/Database/backup` / `POST /api/Database/restore` — экспорт/импорт SQL дампа через `pg_dump`/`psql` (используются в админке для бэкапа БД).

## Полезно
- При выполнении DML вызывайте функцию `set_current_user_id` в рамках транзакций, чтобы аудит фиксировал автора.
- Для деплоя используйте `dotnet publish -c Release`.
