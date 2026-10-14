# LIFESTYLE — архитектура продукта

Соцсеть живых встреч: люди находят встречи и сообщества по интересам, площадки и сообщества публикуют встречи.

## Роли

Аккаунт один на человека. Организация и сообщество — отдельные сущности, которыми пользователь управляет через роль.
Так владелец сети кафе ведёт несколько заведений с одного аккаунта, а права можно передать сотруднику.

| Роль | Кто | Что может |
|---|---|---|
| Пользователь | любой, кто вошёл по номеру телефона | смотреть ленту, записываться и платить, вступать в сообщества, писать в ленту сообщества, создавать сообщества, жаловаться |
| Владелец организации | пользователь, зарегистрировавший кафе, клуб, спортцентр | публиковать встречи от имени организации; **платные** — только после верификации |
| Владелец / модератор сообщества | создатель сообщества или назначенный им | публиковать **бесплатные** встречи от имени сообщества, модерировать ленту |
| Администратор платформы | команда LIFESTYLE | верификация организаций, разбор жалоб, блокировки |

## Ключевые бизнес-правила

1. **Деньги принимает только проверенная организация** (ТОО или ИП с БИН/ИИН, статус `verified`).
   Физлицо без ИП не может легально получать оплату за встречи. Платформа работает по агентской схеме:
   принимает оплату, удерживает комиссию и перечисляет остаток организации.
2. **Встречи сообществ в MVP бесплатные.** Если организатору сообщества нужно продавать места, он регистрирует ИП как организацию.
3. **Платная бронь держит место 15 минут** (`pending_payment`). Без оплаты бронь снимается по таймауту.
   Статус `confirmed` выставляет только бэкенд — по вебхуку Kaspi, не по ответу клиента.
4. **При отмене встречи** все брони отменяются, по оплаченным броням оформляется возврат.
5. **Каждый пользовательский контент можно обжаловать** (встреча, сообщество, пост, организация, пользователь).
   Это требование App Store (Guideline 1.2) и Google Play для приложений с пользовательским контентом.
   Нужны ещё блокировка пользователя и фильтр контента до публикации в сторы.

## Модель данных

Контракт клиента — `src/api/types.ts`. Схема БД (PostgreSQL):

```
users            id, phone (unique, E.164), name, city_id, interests[], created_at, blocked_at
organizations    id, owner_id → users, name, type, city_id, address, description,
                 bin (12 цифр), status (pending|verified|rejected), verified_at, created_at
communities      id, owner_id → users, name, description, city_id, interests[], telegram_url, created_at
community_members community_id, user_id, role (owner|moderator|member), joined_at   PK(community_id, user_id)
events           id, host_type (organization|community), host_id, created_by → users, city_id, interest_id,
                 title, description, venue, address, starts_at, duration_min, price_kzt, capacity,
                 status (published|cancelled), created_at
bookings         id, event_id, user_id, status (pending_payment|confirmed|cancelled),
                 expires_at, created_at                 UNIQUE(event_id, user_id) WHERE status <> 'cancelled'
payments         id, booking_id, provider (kaspi), provider_payment_id, amount_kzt, status, raw jsonb, created_at
posts            id, community_id, author_id, text, created_at, deleted_at
reports          id, reporter_id, target_type, target_id, reason, status, created_at
```

Счётчики (`booked_count`, `members_count`) отдаются денормализованно. Запись на встречу — в транзакции
с `SELECT … FOR UPDATE` по событию, иначе при гонке будет овербукинг.

## API

REST, JSON, `Authorization: Bearer <JWT>`. Ошибки: `{ "error": { "code": "...", "message": "..." } }`,
коды — `ApiErrorCode` в `src/api/api.ts`. Полный список методов — `src/api/http-api.ts`.

| Метод | Путь | Назначение |
|---|---|---|
| POST | /v1/auth/otp | отправить SMS-код |
| POST | /v1/auth/otp/verify | проверить код → `{ token, user, isNew }` |
| GET / PATCH | /v1/me | профиль |
| GET | /v1/events?city=&interest=&hostType=&hostId= | лента |
| GET / POST | /v1/events, /v1/events/:id | встреча, создание |
| POST | /v1/events/:id/cancel | отмена (автор) |
| POST | /v1/events/:id/bookings | записаться |
| POST | /v1/bookings/:id/pay | создать платёж Kaspi → ссылка / QR |
| POST | /v1/bookings/:id/cancel | отменить запись |
| GET | /v1/me/bookings, /v1/me/organizations, /v1/me/communities | «моё» |
| POST | /v1/organizations | регистрация → `pending` |
| GET / POST | /v1/communities, /v1/communities/:id | сообщества |
| POST / DELETE | /v1/communities/:id/members(/me) | вступить / выйти |
| GET / POST | /v1/communities/:id/posts | лента сообщества |
| POST | /v1/reports | жалоба |
| POST | /v1/webhooks/kaspi | вебхук оплаты (серверный) |

## Авторизация

1. Вход по номеру телефона: SMS OTP, 4 цифры, TTL 5 минут, не больше 5 попыток и 3 отправок в час на номер и IP.
2. Ответ — JWT access (15 мин) + refresh (30 дней). На устройстве токен хранится в Keychain/Keystore (`expo-secure-store`).
3. Вход через Telegram — следующий шаг: Telegram Login Widget через WebView, подпись `hash` проверяется на сервере
   ботом `@LIFESTYLEK_BOT`. Аккаунты связываются по телефону.

## Требования Казахстана

- **Персональные данные граждан РК хранятся на серверах в РК** (закон «О персональных данных и их защите», ст. 12).
  Хостинг БД и бэкапов — в казахстанском дата-центре (PS Cloud, Kazakhtelecom, QazCloud и т.п.).
- Согласие на обработку персональных данных — явное, при регистрации, с версией документа в логе.
- Акцепт оферты — при оплате, с фиксацией `user_id`, времени и версии оферты.
- Платежи: Kaspi Pay (основной), карты Visa/Mastercard через эквайринг банка РК.

## Мобильный клиент

- Expo SDK 57, Expo Router (файловая маршрутизация), TanStack Query (кэш и инвалидация).
- `Stack.Protected` в `src/app/_layout.tsx` разводит три состояния: гость → вход; профиль не заполнен → онбординг; приложение.
- Без `EXPO_PUBLIC_API_URL` работает тестовый сервер на устройстве (`src/api/mock-api.ts`). Он повторяет бизнес-правила выше,
  поэтому UI можно делать и показывать до готовности бэкенда.

## Дальше

1. Бэкенд по этому контракту, интеграция с SMS-провайдером и Kaspi Pay.
2. Push-уведомления: напоминание за 2 часа, новые встречи в сообществах, ответы в ленте.
3. Чат: в MVP переписка остаётся в Telegram-группах сообществ, свой чат — после проверки спроса.
4. Чек-ин по QR на входе (для организаций) и рейтинг встреч после посещения.
5. Кабинет организации: список участников, выгрузка, выплаты; админка модерации.
