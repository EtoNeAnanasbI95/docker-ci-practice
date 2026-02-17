# SSO Service (Go)

Лёгкий SSO для магазина/админки. Отвечает за регистрацию, логин, refresh токенов и возвращает роль пользователя.

## Требования
- Go 1.22+
- PostgreSQL (общая БД coursework_db)
- Переменные окружения из `config/config.yaml`

## Сборка/запуск
```bash
cd backend/sso
go mod download
go run ./cmd/sso
```

или через make:
```bash
make run
```

По умолчанию сервис стартует на `:8081`.

## Конфигурация
`config/config.yaml`:
```yaml
connection_string: "postgres://admin:password@localhost:5432/coursework_db?sslmode=disable"
secret: "jwt-secret"
http:
  port: 8081
```

## Swagger
Сгенерированная спецификация лежит в `docs/swagger.{json,yaml}` и отражает актуальные поля `AuthResponse`
(теперь возвращает `access_token`, `refresh_token`, `user_id`, `role`). Используйте, например, [Swagger Editor](https://editor.swagger.io/).

Перегенерировать можно командой:
```bash
cd backend/sso
go install github.com/swaggo/swag/cmd/swag@latest
make swagger
```

## Основные эндпоинты
- `POST /auth/logIn` — авторизация по `login/password`.
- `POST /auth/signUp` — регистрация (принимает `login`, `password`, `full_name`).
- `POST /auth/refresh` — обновление токенов.
- `POST /auth/password/request` — выпускает токен сброса пароля (использует БД-функцию `request_password_reset`).
- `POST /auth/password/complete` — принимает токен и новый пароль, обновляет `users.password`.

Ответы содержат роль пользователя. Фронтенд shop решает, отправлять ли пользователя в Adminer.

## Контакты с БД
Репозиторий использует `WITH ... SELECT` с `JOIN roles`, чтобы подтянуть имя роли, а транзакции выставляют `app.current_user_id`
для корректного аудита.
