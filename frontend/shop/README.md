# Chairly Shop

Клиентское Next.js приложение интернет-магазина стульев. Использует Shadcn UI, React Query и общее SSO/API с админ-панелью.

## Возможности

- публичный каталог, построенный на представлении `v_product_inventory`;
- регистрация и авторизация через единый SSO (`/login`, `/register`);
- единая форма входа: SSO определяет роль пользователя;
- автоматический редирект администраторов и менеджеров в Adminer (с передачей токенов);
- отдельные страницы каталога (`/catalog`), избранного (`/favorites`), корзины (`/cart`) и личного кабинета (`/account`);
- хранение access/refresh токенов в `localStorage` для работы магазина;
- готовая структура для расширения (Next 15, App Router, shadcn/ui).

## Скрипты

```bash
pnpm install   # установка зависимостей
pnpm dev       # запуск dev-сервера
pnpm build     # production-сборка
pnpm start     # запуск prod-сборки
pnpm lint      # ESLint
```

### Переменные окружения

Создайте `frontend/shop/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SSO_URL=http://localhost:8081
NEXT_PUBLIC_ADMIN_APP_URL=http://localhost:3001
```

## Структура

```
src/
├── app/                # layout, страницы магазина и логин
├── shared/
│   ├── api/            # общий REST-клиент
│   ├── lib/            # утилиты
│   ├── types/          # типы DTO/моделей
│   └── ui/             # переиспользуемые компоненты shadcn/ui
└── app/providers.tsx   # React Query Provider
```

## Авторизация

1. Пользователь вводит логин/пароль → запрос к `SSO /auth/login`.
2. SSO отвечает access/refresh токенами, `user_id` и `role`.
3. Токены сохраняются в `localStorage`.
4. Роли `admin`/`manager` перенаправляются на `NEXT_PUBLIC_ADMIN_APP_URL?accessToken=...`.
5. Остальные остаются в магазине и используют токен для API-запросов.

## TODO

- добавить сохранение пользовательских настроек (процедура `upsert_user_preferences`);
- интегрировать корзину и оформление заказа через процедуры `create_order_with_details`;
- реализовать обработку токенов на стороне Adminer (парсинг query, refresh-flow).
