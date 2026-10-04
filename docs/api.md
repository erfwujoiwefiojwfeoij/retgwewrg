# LUNEA API

Базовый URL в разработке: `http://localhost:4000/api`. Фронтенд ходит на `/api` через rewrite.

Мутации, кроме входа, регистрации, сброса пароля и refresh, требуют заголовок `x-csrf-token`, совпадающий с cookie `csrf_token`. Сессия хранится в httpOnly cookie `access_token` и `refresh_token`.

## Auth

- `POST /auth/register` — роли `CLIENT`, `SALON_OWNER`. Мастера не регистрируются сами: салон создаёт их и получает логин с паролем.
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/refresh`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /auth/verify-email`
- `GET /auth/me`
- `PATCH /auth/me`

## Каталог

- `GET /home`
- `GET /search`
- `GET /search/suggest`
- `GET /salons`, `GET /salons/:slug`, `POST /salons`, `PATCH /salons/:id`
- `POST /salons/:id/branches`, `DELETE /branches/:id`
- `GET /masters`, `GET /masters/:slug`, `POST /masters`, `PATCH /masters/:id`, `DELETE /masters/:id`
- `POST /masters/:id/password` — салон заново выдаёт пароль мастеру
- `PUT /masters/:id/hours`
- `GET|POST /masters/:id/days-off`, `DELETE /masters/:id/days-off/:dayOffId`
- `GET /services`, `GET /services/:id`, `POST /services`, `PATCH /services/:id`
- `GET /categories`
- `GET /cities`

## Запись

- `GET /availability?masterId&serviceId&date`
- `GET /bookings`
- `POST /bookings`
- `PATCH /bookings/:id` — статус или `startAt`
- `GET /reviews`, `POST /reviews`, `POST /reviews/:id/reply`

Статусы: `PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `NO_SHOW`.

## Кабинет

- `GET /favorites`, `POST /favorites`
- `GET /notifications`, `POST /notifications/read`
- `GET|POST /messages`, `GET|POST /messages/:id`
- `GET /business/workspace`
- `GET /business/stats`
- `GET /business/clients`, `PATCH /business/clients/:id`

## Админ

Префикс `/admin`, роль `SUPER_ADMIN`: users, salons, masters, bookings, reviews, reports, categories, settings.

Ошибки: `{ "error": { "message": "...", "fields": {} } }`.
