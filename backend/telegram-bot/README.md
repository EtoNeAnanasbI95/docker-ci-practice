# Telegram Bot for Chair Shop

Простой бот, который принимает сообщения от пользователей, запоминает их `chat_id` и вызывает REST API магазина для отправки кода подтверждения Telegram.

## Настройка

1. Создайте `.env` в папке `telegram-bot`:

```env
TELEGRAM_BOT_TOKEN=7983504170:XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
SHOP_API_URL=http://localhost:5000/api
REGISTRATION_BOT_SECRET=change-me
```

`SHOP_API_URL` должен указывать на запущенный backend (порт 5000 в dev compose). `REGISTRATION_BOT_SECRET` должен совпадать с настройкой `Registration:BotSecret` в API.

2. Установите зависимости и запустите бота:

```bash
cd telegram-bot
npm install
npm start
```

Бот работает в режиме polling и реагирует на `/start <registrationId>` (ссылка формируется на странице регистрации). Если пользователь пишет боту без параметров, он напоминает использовать кнопку из магазина.

После успешного вызова API пользователю приходит код подтверждения, который нужно ввести на сайте.
