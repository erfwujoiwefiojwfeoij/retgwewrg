# LUNEA

Платформа записи для салонов, мастеров и клиентов.

Слоган: «Красота начинается с правильного выбора.»

## Стек

- Frontend: Next.js, React, JavaScript, Tailwind CSS, Framer Motion, Lucide
- Backend: Node.js, Express, Prisma, PostgreSQL
- В разработке PostgreSQL поднимается пакетом `embedded-postgres`, если свой сервер не запущен

## Установка

```bash
npm install
```

Команда ставит зависимости корня, `backend` и `frontend`.

Скопируйте окружение, если файлов ещё нет:

```bash
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env.local
```

## Переменные

`backend/.env`

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `FRONTEND_URL`
- `EMBEDDED_POSTGRES` — `true` для встроенной базы, `false` для внешнего PostgreSQL
- `UPLOAD_DIR`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`

`frontend/.env.local`

- `NEXT_PUBLIC_API_URL`
- `API_PROXY_URL`
- `NEXT_PUBLIC_SITE_URL`

Без SMTP ссылки подтверждения и сброса пишутся в лог API и в dev-ответ.

## База

Из папки `backend`:

```bash
npx prisma migrate dev
npx prisma db seed
```

Из корня, когда PostgreSQL уже слушает порт из `DATABASE_URL`:

```bash
npm run db:migrate
npm run db:seed
```

`npm run db:up` только поднимает встроенный PostgreSQL и не завершается.

Первый запуск API сам применяет миграции (`prisma migrate deploy`) и при `EMBEDDED_POSTGRES=true` стартует локальный сервер на порту `5433`, данные в `database/data`. На Windows, если текущий пользователь входит в группу администраторов, PostgreSQL поднимается отдельным процессом с ограниченным токеном: сервер не стартует из-под администратора.

## Разработка

```bash
npm run dev
```

- Сайт: http://localhost:3000
- API: http://localhost:4000

## Сборка и запуск

```bash
npm run build
npm run start
```

Для продакшена укажите внешний `DATABASE_URL` и `EMBEDDED_POSTGRES=false`.

## Демо-доступ

Пароль у всех: `LuneaDemo2026!`

- `client@lunea.test` — клиент
- `owner@lunea.test` — владелец «Ателье Северное»
- `master@lunea.test` — мастер этого салона
- `admin@lunea.test` — суперадмин

## Роли

`CLIENT`, `MASTER`, `SALON_OWNER`, `SALON_ADMIN`, `SUPER_ADMIN`.

Мастер может работать без салона: при регистрации создаётся независимый профиль, услуги и часы.

## Авторизация

Пароли хранятся как bcrypt-хеш. Access JWT живёт 15 минут, refresh — 7 дней, оба в httpOnly cookie. Refresh-токен ротируется. Мутации защищены CSRF-cookie. Роли проверяются на сервере.

OAuth не подключён: у пользователя есть поле `authProvider` со значением `email`.

## API

См. [docs/api.md](docs/api.md).
