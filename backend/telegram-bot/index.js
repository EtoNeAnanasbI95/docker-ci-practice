import 'dotenv/config';
import fetch from 'node-fetch';
import TelegramBot from 'node-telegram-bot-api';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_BASE_URL = process.env.SHOP_API_URL ?? 'http://localhost:5000/api';
const REGISTRATION_SECRET =
  process.env.REGISTRATION_BOT_SECRET && process.env.REGISTRATION_BOT_SECRET.trim().length > 0
    ? process.env.REGISTRATION_BOT_SECRET.trim()
    : 'change-me';

if (!process.env.REGISTRATION_BOT_SECRET) {
  console.warn(
    'REGISTRATION_BOT_SECRET is not set. Falling back to default "change-me" from API appsettings.'
  );
}

if (!BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN is not set. Please provide it in .env.');
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

const HELP_TEXT =
  'Используйте ссылку из магазина (кнопка "Открыть Telegram-бота") — в ней уже будет код регистрации. Просто нажмите её и мы пришлём код автоматически.';

bot.onText(/^\/start(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const registrationToken = match && match[1] ? match[1].trim() : '';

  if (!registrationToken) {
    await bot.sendMessage(
      chatId,
      `Привет, ${formatName(msg.from)}!\n\n${HELP_TEXT}`
    );
    return;
  }

  await sendRegistrationCode({
    chatId,
    registrationId: registrationToken,
  });
});

bot.on('message', async (msg) => {
  if (msg.text && msg.text.startsWith('/')) {
    return;
  }

  const chatId = msg.chat.id;
  await bot.sendMessage(chatId, HELP_TEXT);
});

async function sendRegistrationCode({ chatId, registrationId }) {
  try {
    const response = await fetch(`${API_BASE_URL}/Registration/bot/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Registration-Secret': REGISTRATION_SECRET,
      },
      body: JSON.stringify({
        registrationId,
        chatId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      await bot.sendMessage(chatId, `Не удалось найти регистрацию: ${errorText}`);
      return;
    }

    const data = await response.json();
    await bot.sendMessage(
      chatId,
      `Ваш код подтверждения: <b>${data.code}</b>\n\nДействителен до ${new Date(
        data.expiresAt
      ).toLocaleString('ru-RU')}.\nВведите его на сайте, чтобы завершить регистрацию.`,
      { parse_mode: 'HTML' }
    );
  } catch (error) {
    console.error('sendRegistrationCode failed', error);
    await bot.sendMessage(chatId, 'Не удалось получить код. Попробуйте ещё раз.');
  }
}

function formatName(user = {}) {
  if (user.first_name || user.last_name) {
    return [user.first_name, user.last_name].filter(Boolean).join(' ');
  }
  return user.username ? `@${user.username}` : 'друг';
}

console.log('Telegram bot is running...');
