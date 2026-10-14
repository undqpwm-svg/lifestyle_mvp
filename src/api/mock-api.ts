import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  BONUS_MAX_SHARE,
  LATE_CANCEL_HOURS,
  LISTING_FEE_KZT,
  MAX_SEATS_PER_BOOKING,
  PASS_PAYOUT_SHARE,
  PASS_PLAN,
  PROMOTION,
  REFERRAL_BONUS_KZT,
} from '@/config/billing';
import { getCity } from '@/config/cities';
import { luhnValid } from '@/lib/card';
import { maskPhone } from '@/lib/phone';

import { ApiError, getAuthToken, type Api } from './api';
import { createSeed, ticketCode, type Db, type DbCommunity, type DbEvent, type DbOrganization, type DbUser } from './mock-seed';
import type {
  AppNotification,
  Booking,
  Community,
  Conversation,
  DirectMessage,
  Friend,
  EventItem,
  HostRating,
  NotificationType,
  Organization,
  Participant,
  Payment,
  PaymentInput,
  PaymentPurpose,
  PersonRef,
  Subscription,
  User,
} from './types';

// Тестовый «сервер» в памяти устройства. Повторяет бизнес-правила будущего бэкенда,
// чтобы UI можно было разрабатывать и показывать без сервера.
// Код подтверждения в моке всегда 1111.

const STORAGE_KEY = 'lifestyle.mockdb.v7';
const MOCK_OTP = '1111';
const TOKEN_PREFIX = 'mock-token:';
const RESEED_AFTER_MS = 3 * 86_400_000;
const HOUR = 3_600_000;

let dbPromise: Promise<Db & { seededAt?: number }> | null = null;

function loadDb() {
  dbPromise ??= (async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const db = JSON.parse(raw) as Db & { seededAt?: number };
        // Даты в тестовых данных относительные — через пару дней лента «протухает».
        // Пересоздаём данные, но сохраняем зарегистрированных пользователей.
        if (db.version === 1 && Date.now() - (db.seededAt ?? 0) < RESEED_AFTER_MS) return db;
        const fresh = { ...createSeed(), seededAt: Date.now() };
        const seedIds = new Set(fresh.users.map((u) => u.id));
        fresh.users.push(...db.users.filter((u) => !seedIds.has(u.id)));
        return fresh;
      }
    } catch {
      // Битые данные — начинаем с чистого листа.
    }
    return { ...createSeed(), seededAt: Date.now() };
  })();
  return dbPromise;
}

// Медиа, снятые на устройстве, в моке не загружаются на сервер: на вебе это blob:/data:-ссылки.
// В localStorage их не кладём (лимит ~5 МБ) — после перезагрузки такие вложения становятся «недоступны».
const isLocalMedia = (url: string) => url.startsWith('blob:') || url.startsWith('data:');

async function save() {
  const db = await loadDb();
  const json = JSON.stringify(db, (key, value) => (key === 'url' && typeof value === 'string' && isLocalMedia(value) ? '' : value));
  await AsyncStorage.setItem(STORAGE_KEY, json).catch(() => {});
}

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));
const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const now = () => new Date().toISOString();

function assert(cond: unknown, code: ConstructorParameters<typeof ApiError>[0], msg?: string): asserts cond {
  if (!cond) throw new ApiError(code, msg);
}

async function currentUser(db: Db): Promise<DbUser> {
  const token = getAuthToken();
  const id = token?.startsWith(TOKEN_PREFIX) ? token.slice(TOKEN_PREFIX.length) : null;
  const user = id ? db.users.find((u) => u.id === id) : undefined;
  if (!user) throw new ApiError('unauthorized');
  return user;
}

const publicUser = ({ referredBy: _r, ...u }: DbUser): User => ({ ...u });
const person = (db: Db, id: string): PersonRef => ({ id, name: db.users.find((u) => u.id === id)?.name ?? '—' });

// Справочные выборки

const isActive = (b: Booking) => b.status === 'pending_payment' || b.status === 'confirmed';

function activeBookings(db: Db, eventId: string) {
  return db.bookings.filter((b) => b.eventId === eventId && isActive(b));
}

function seatsTaken(db: Db, e: DbEvent) {
  return e.seedBooked + activeBookings(db, e.id).reduce((n, b) => n + b.seats, 0);
}

function friendIds(db: Db, userId: string): string[] {
  return db.friendships
    .filter((f) => f.status === 'accepted' && (f.from === userId || f.to === userId))
    .map((f) => (f.from === userId ? f.to : f.from));
}

/** Есть ли блокировка в любую сторону между двумя пользователями */
function blockedEither(db: Db, a: string, b: string) {
  return db.blocks.some((x) => (x.by === a && x.target === b) || (x.by === b && x.target === a));
}

function blockedByMe(db: Db, meId: string): Set<string> {
  return new Set(db.blocks.filter((x) => x.by === meId).map((x) => x.target));
}

function roleIn(db: Db, communityId: string, userId: string) {
  return db.members.find((m) => m.communityId === communityId && m.userId === userId)?.role ?? null;
}

/** Может ли пользователь управлять встречей: владелец организации или владелец/модератор сообщества. */
function canManageEvent(db: Db, e: DbEvent, userId: string) {
  if (e.host.type === 'organization') return db.organizations.find((o) => o.id === e.host.id)?.ownerId === userId;
  const role = roleIn(db, e.host.id, userId);
  return role === 'owner' || role === 'moderator';
}

function hostRating(db: Db, type: 'organization' | 'community', id: string): HostRating | null {
  const list = db.reviews.filter((r) => r.host.type === type && r.host.id === id);
  if (!list.length) return null;
  return { avg: Math.round((list.reduce((s, r) => s + r.rating, 0) / list.length) * 10) / 10, count: list.length };
}

const eventEndsAt = (e: DbEvent) => new Date(e.startsAt).getTime() + e.durationMin * 60_000;
const isPromoted = (e: DbEvent) => !!e.promotedUntil && new Date(e.promotedUntil).getTime() > Date.now();

// Проекции «таблиц» в DTO

function toEvent(db: Db, e: DbEvent, userId: string | null): EventItem {
  const host =
    e.host.type === 'organization'
      ? db.organizations.find((o) => o.id === e.host.id)
      : db.communities.find((c) => c.id === e.host.id);
  const { seedBooked: _s, ...rest } = e;
  const friends = userId ? new Set(friendIds(db, userId)) : new Set<string>();
  const queue = db.waitlist.filter((w) => w.eventId === e.id);
  const pos = userId ? queue.findIndex((w) => w.userId === userId) : -1;
  return {
    ...rest,
    host: {
      ...e.host,
      name: host?.name ?? '—',
      verified: e.host.type === 'organization' && (host as DbOrganization | undefined)?.status === 'verified',
    },
    bookedCount: seatsTaken(db, e),
    myBooking: userId ? (activeBookings(db, e.id).find((b) => b.userId === userId) ?? null) : null,
    myWaitlistPosition: pos >= 0 ? pos + 1 : null,
    friendsGoing: activeBookings(db, e.id)
      .filter((b) => friends.has(b.userId))
      .map((b) => person(db, b.userId)),
  };
}

function toOrganization(db: Db, o: DbOrganization): Organization {
  return { ...o, rating: hostRating(db, 'organization', o.id) };
}

function toCommunity(db: Db, c: DbCommunity, userId: string | null): Community {
  const { seedMembers, ...rest } = c;
  const members = db.members.filter((m) => m.communityId === c.id);
  return {
    ...rest,
    rating: hostRating(db, 'community', c.id),
    membersCount: seedMembers + members.filter((m) => m.userId !== c.ownerId).length,
    myRole: members.find((m) => m.userId === userId)?.role ?? null,
  };
}

// Уведомления

function notify(db: Db, userId: string, type: NotificationType, params: Record<string, string>, link?: AppNotification['link']) {
  db.notifications.push({ id: uid('n'), userId, type, params, link, createdAt: now() });
}

const eventLink = (id: string) => ({ pathname: '/event/[id]', params: { id } });

/**
 * «Отложенные» уведомления. На бэкенде их ставит планировщик (напоминание за 2 часа,
 * просьба об отзыве после встречи); мок создаёт их при запросе ленты уведомлений.
 */
function materializeScheduled(db: Db, userId: string) {
  const t = Date.now();
  for (const b of db.bookings.filter((x) => x.userId === userId && x.status === 'confirmed')) {
    const e = db.events.find((x) => x.id === b.eventId);
    if (!e || e.status !== 'published') continue;
    const start = new Date(e.startsAt).getTime();
    const remindKey = `reminder:${b.id}`;
    if (start > t && start - t <= 2 * HOUR && !db.notified.includes(remindKey)) {
      db.notified.push(remindKey);
      notify(db, userId, 'reminder', { title: e.title, time: e.startsAt, venue: e.venue }, eventLink(e.id));
    }
    const reviewKey = `review:${b.id}`;
    const reviewed = db.reviews.some((r) => r.eventId === e.id && r.userId === userId);
    if (eventEndsAt(e) < t && !reviewed && !db.notified.includes(reviewKey)) {
      db.notified.push(reviewKey);
      notify(db, userId, 'review_request', { title: e.title }, { pathname: '/review/[bookingId]', params: { bookingId: b.id } });
    }
  }
}

// Платёжный «шлюз»
// Kaspi — всегда успешно (подтверждение в приложении Kaspi имитирует клиент).
// Карта: проверка Луна/срока/CVC; тестовая карта 4000 0000 0000 0002 — отказ банка.
const DECLINED_CARD = '4000000000000002';

async function charge(db: Db, user: DbUser, purpose: PaymentPurpose, amountKzt: number, input: PaymentInput): Promise<Payment> {
  await delay(900);
  if (input.method === 'card') {
    const { number, expMonth, expYear, cvc } = input.card;
    const expired = new Date(expYear, expMonth, 0, 23, 59, 59) < new Date();
    assert(luhnValid(number) && !expired && /^\d{3}$/.test(cvc), 'validation', 'card');
  }
  const bonusKzt = input.useBonus ? Math.min(user.bonusKzt, Math.floor(amountKzt * BONUS_MAX_SHARE)) : 0;
  const declined = input.method === 'card' && input.card.number === DECLINED_CARD;
  const payment: Payment = {
    id: uid('pay'),
    purpose,
    amountKzt,
    bonusKzt,
    method: input.method,
    status: declined ? 'failed' : 'succeeded',
    createdAt: now(),
  };
  db.payments.push({ ...payment, userId: user.id });
  if (!declined) user.bonusKzt -= bonusKzt;
  await save();
  if (declined) throw new ApiError('payment_declined');
  return payment;
}

function currentSubscription(db: Db, userId: string): Subscription | null {
  const sub = db.subscriptions.filter((x) => x.userId === userId).sort((a, b) => b.endsAt.localeCompare(a.endsAt))[0];
  if (!sub) return null;
  const expired = new Date(sub.endsAt).getTime() < Date.now();
  // Посещение списывается и при поздней отмене (cancelled_late) — защита от неявок.
  const visitsUsed = db.bookings.filter(
    (b) => b.userId === userId && b.viaSubscription && b.status !== 'cancelled' && b.createdAt >= sub.startedAt,
  ).length;
  const { userId: _omit, ...rest } = sub;
  return { ...rest, status: expired ? 'expired' : sub.status, visitsUsed };
}

/** Освободились места — предлагаем их очереди по порядку. */
function promoteWaitlist(db: Db, e: DbEvent) {
  while (seatsTaken(db, e) < e.capacity) {
    const next = db.waitlist.find((w) => w.eventId === e.id);
    if (!next) return;
    db.waitlist = db.waitlist.filter((w) => w !== next);
    // Бесплатная — сразу участник; платная — место держится до оплаты (на бэкенде 30 минут).
    db.bookings.push({
      id: uid('b'),
      eventId: e.id,
      userId: next.userId,
      status: e.priceKzt === 0 ? 'confirmed' : 'pending_payment',
      viaSubscription: false,
      seats: 1,
      code: ticketCode(),
      createdAt: now(),
    });
    notify(db, next.userId, 'waitlist_offer', { title: e.title, paid: e.priceKzt > 0 ? '1' : '' }, eventLink(e.id));
  }
}

// Демо-оживление: на первое сообщение пользователя в сообществе отвечает организатор,
// на заявку в друзья тестовые пользователи соглашаются.
const WELCOME_REPLIES = [
  'Привет! Рады тебе в чате. Ближайшие встречи — во вкладке «Встречи» сообщества.',
  'Добро пожаловать! Если есть вопросы по встречам — пиши сюда.',
];

function scheduleWelcome(db: Db, communityId: string, userId: string) {
  const c = db.communities.find((x) => x.id === communityId);
  if (!c || c.ownerId === userId) return;
  const owner = db.users.find((u) => u.id === c.ownerId);
  if (!owner) return;
  setTimeout(() => {
    db.messages.push({
      id: uid('m'),
      communityId,
      authorId: owner.id,
      authorName: owner.name,
      text: WELCOME_REPLIES[communityId.length % WELCOME_REPLIES.length],
      attachments: [],
      createdAt: now(),
    });
    notify(db, userId, 'chat_message', { community: c.name, author: owner.name }, { pathname: '/community/[id]/chat', params: { id: c.id } });
    save();
  }, 2500);
}

const SEED_USERS = new Set(['u-aman', 'u-dana', 'u-erlan', 'u-aliya']);

export const mockApi: Api = {
  async requestCode(phone) {
    await delay(500);
    assert(/^\+77\d{9}$/.test(phone), 'validation', 'phone');
  },

  async verifyCode(phone, code) {
    await delay(400);
    assert(code === MOCK_OTP, 'invalid_code');
    const db = await loadDb();
    let user = db.users.find((u) => u.phone === phone);
    const isNew = !user;
    if (!user) {
      user = {
        id: uid('u'),
        phone,
        name: '',
        cityId: 'astana',
        interests: [],
        referralCode: ticketCode(),
        bonusKzt: 0,
        createdAt: now(),
      };
      db.users.push(user);
      notify(db, user.id, 'welcome', {});
      await save();
    }
    return { token: TOKEN_PREFIX + user.id, user: publicUser(user), isNew };
  },

  async me() {
    return publicUser(await currentUser(await loadDb()));
  },

  async updateProfile(input) {
    await delay();
    const db = await loadDb();
    const user = await currentUser(db);
    assert(input.name.trim().length >= 2, 'validation', 'name');
    Object.assign(user, { ...input, name: input.name.trim() });
    await save();
    return publicUser(user);
  },

  async applyReferral(code) {
    await delay();
    const db = await loadDb();
    const me = await currentUser(db);
    const referrer = db.users.find((u) => u.referralCode === code.trim().toUpperCase());
    assert(referrer && referrer.id !== me.id && !me.referredBy, 'invalid_referral');
    me.referredBy = referrer.id;
    me.bonusKzt += REFERRAL_BONUS_KZT;
    referrer.bonusKzt += REFERRAL_BONUS_KZT;
    notify(db, referrer.id, 'referral_bonus', { name: me.name || me.phone, amount: String(REFERRAL_BONUS_KZT) });
    await save();
    return publicUser(me);
  },

  async registerPushToken(token) {
    const db = await loadDb();
    const me = await currentUser(db);
    if (!db.pushTokens.some((p) => p.token === token)) db.pushTokens.push({ userId: me.id, token });
    await save();
  },

  async listEvents(f) {
    await delay();
    const db = await loadDb();
    const me = await currentUser(db).catch(() => null);
    const from = Date.now() - 3 * HOUR; // показываем и начавшиеся недавно
    return db.events
      .filter(
        (e) =>
          (e.status === 'published' || (e.status === 'awaiting_payment' && e.createdBy === me?.id && !!f.hostId)) &&
          e.cityId === f.cityId &&
          new Date(e.startsAt).getTime() > from &&
          (!f.interestId || e.interestId === f.interestId) &&
          (!f.hostType || e.host.type === f.hostType) &&
          (!f.hostId || e.host.id === f.hostId),
      )
      // Продвигаемые встречи закреплены сверху, остальные — по дате.
      .sort((a, b) => Number(isPromoted(b)) - Number(isPromoted(a)) || a.startsAt.localeCompare(b.startsAt))
      .map((e) => toEvent(db, e, me?.id ?? null));
  },

  async getEvent(id) {
    await delay();
    const db = await loadDb();
    const me = await currentUser(db).catch(() => null);
    const e = db.events.find((x) => x.id === id);
    return e ? toEvent(db, e, me?.id ?? null) : null;
  },

  async listRecommended(cityId) {
    await delay();
    const db = await loadDb();
    const me = await currentUser(db);
    const friends = new Set(friendIds(db, me.id));
    const myCommunities = new Set(db.members.filter((m) => m.userId === me.id).map((m) => m.communityId));
    const t = Date.now();
    // Простая модель ранжирования; на бэкенде — та же формула + история посещений и отзывы.
    const score = (e: DbEvent) =>
      (me.interests.includes(e.interestId) ? 3 : 0) +
      activeBookings(db, e.id).filter((b) => friends.has(b.userId)).length * 2 +
      (e.host.type === 'community' && myCommunities.has(e.host.id) ? 2 : 0) +
      (isPromoted(e) ? 1.5 : 0) +
      (new Date(e.startsAt).getTime() - t < 48 * HOUR ? 0.5 : 0);
    return db.events
      .filter(
        (e) =>
          e.status === 'published' &&
          e.cityId === cityId &&
          new Date(e.startsAt).getTime() > t &&
          !activeBookings(db, e.id).some((b) => b.userId === me.id) &&
          seatsTaken(db, e) < e.capacity,
      )
      .map((e) => ({ e, s: score(e) }))
      .filter((x) => x.s >= 2)
      .sort((a, b) => b.s - a.s)
      .slice(0, 6)
      .map((x) => toEvent(db, x.e, me.id));
  },

  async getEventAttendees(eventId) {
    await delay();
    const db = await loadDb();
    const me = await currentUser(db).catch(() => null);
    const hidden = me ? blockedByMe(db, me.id) : new Set<string>();
    const ids = [...new Set(db.bookings.filter((b) => b.eventId === eventId && b.status === 'confirmed').map((b) => b.userId))];
    return ids.filter((id) => !hidden.has(id) && !(me && blockedEither(db, me.id, id))).map((id) => person(db, id));
  },

  async createEvent(input) {
    await delay(400);
    const db = await loadDb();
    const me = await currentUser(db);
    let cityId: DbEvent['cityId'];
    let location = getCity(me.cityId).center;

    // Права: организация — только владелец; сообщество — владелец или модератор.
    let status: DbEvent['status'] = 'published';
    if (input.host.type === 'organization') {
      const org = db.organizations.find((o) => o.id === input.host.id);
      assert(org && org.ownerId === me.id, 'forbidden');
      assert(org.status !== 'rejected', 'forbidden', 'org_rejected');
      // Принимать оплату может только проверенная организация (есть договор и реквизиты).
      assert(input.priceKzt === 0 || org.status === 'verified', 'forbidden', 'paid_requires_verified');
      cityId = org.cityId;
      location = org.location;
      // Организация публикует после оплаты размещения.
      status = 'awaiting_payment';
    } else {
      const c = db.communities.find((x) => x.id === input.host.id);
      const role = roleIn(db, input.host.id, me.id);
      assert(c && (role === 'owner' || role === 'moderator'), 'forbidden');
      assert(input.priceKzt === 0, 'forbidden', 'paid_requires_verified');
      cityId = c.cityId;
      location = getCity(c.cityId).center;
    }
    assert(input.title.trim().length >= 3, 'validation', 'title');
    assert(input.capacity >= 2 && input.capacity <= 1000, 'validation', 'capacity');
    assert(new Date(input.startsAt).getTime() > Date.now(), 'validation', 'startsAt');
    // В подписку можно включить только платную встречу организации.
    const canInclude = input.host.type === 'organization' && input.priceKzt > 0;

    const e: DbEvent = {
      ...input,
      id: uid('e'),
      cityId,
      // Без геокодера адреса ставим точку площадки; на бэкенде — геокодинг 2GIS.
      location,
      title: input.title.trim(),
      description: input.description.trim(),
      includedInSubscription: canInclude && input.includedInSubscription,
      seedBooked: 0,
      status,
      createdBy: me.id,
    };
    db.events.push(e);
    if (status === 'published') announceNewEvent(db, e);
    await save();
    return toEvent(db, e, me.id);
  },

  async payEventListing(eventId, payment) {
    const db = await loadDb();
    const me = await currentUser(db);
    const e = db.events.find((x) => x.id === eventId);
    assert(e && e.createdBy === me.id, 'not_found');
    assert(e.status === 'awaiting_payment', 'validation', 'already_paid');
    await charge(db, me, 'listing', LISTING_FEE_KZT, payment);
    e.status = 'published';
    announceNewEvent(db, e);
    await save();
    return toEvent(db, e, me.id);
  },

  async promoteEvent(eventId, payment) {
    const db = await loadDb();
    const me = await currentUser(db);
    const e = db.events.find((x) => x.id === eventId);
    assert(e && e.host.type === 'organization' && canManageEvent(db, e, me.id), 'forbidden');
    assert(e.status === 'published', 'validation', 'not_published');
    await charge(db, me, 'promotion', PROMOTION.priceKzt, payment);
    const base = isPromoted(e) ? new Date(e.promotedUntil!).getTime() : Date.now();
    e.promotedUntil = new Date(base + PROMOTION.days * 86_400_000).toISOString();
    await save();
    return toEvent(db, e, me.id);
  },

  async cancelEvent(id) {
    await delay();
    const db = await loadDb();
    const me = await currentUser(db);
    const e = db.events.find((x) => x.id === id);
    assert(e, 'not_found');
    assert(e.createdBy === me.id, 'forbidden');
    e.status = 'cancelled';
    // Брони отменяются; на бэкенде — ещё и возврат денег через Kaspi/эквайринг.
    db.bookings.filter((b) => b.eventId === id).forEach((b) => (b.status = 'cancelled'));
    db.waitlist = db.waitlist.filter((w) => w.eventId !== id);
    await save();
  },

  async myBookings() {
    await delay();
    const db = await loadDb();
    const me = await currentUser(db);
    return db.bookings
      .filter((b) => b.userId === me.id && isActive(b))
      .map((b) => {
        const e = db.events.find((x) => x.id === b.eventId)!;
        const myReview = db.reviews.find((r) => r.eventId === e.id && r.userId === me.id) ?? null;
        return {
          ...b,
          event: toEvent(db, e, me.id),
          myReview,
          canReview: b.status === 'confirmed' && new Date(e.startsAt).getTime() < Date.now() && !myReview,
        };
      })
      .sort((a, b) => a.event.startsAt.localeCompare(b.event.startsAt));
  },

  async getBooking(bookingId) {
    await delay(150);
    const db = await loadDb();
    const me = await currentUser(db);
    const b = db.bookings.find((x) => x.id === bookingId && x.userId === me.id);
    if (!b) return null;
    const e = db.events.find((x) => x.id === b.eventId)!;
    const myReview = db.reviews.find((r) => r.eventId === e.id && r.userId === me.id) ?? null;
    return {
      ...b,
      event: toEvent(db, e, me.id),
      myReview,
      canReview: b.status === 'confirmed' && new Date(e.startsAt).getTime() < Date.now() && !myReview,
    };
  },

  async book(eventId, options) {
    await delay(400);
    const db = await loadDb();
    const me = await currentUser(db);
    const e = db.events.find((x) => x.id === eventId);
    assert(e && e.status === 'published', 'not_found');
    const existing = activeBookings(db, eventId).find((b) => b.userId === me.id);
    if (existing) return existing;
    const seats = Math.floor(options?.seats ?? 1);
    assert(seats >= 1 && seats <= MAX_SEATS_PER_BOOKING, 'validation', 'seats');
    assert(seatsTaken(db, e) + seats <= e.capacity, 'event_full');
    let viaSubscription = false;
    if (options?.useSubscription) {
      const sub = currentSubscription(db, me.id);
      // По подписке — только своё место: гостей оплачивают отдельно.
      assert(seats === 1, 'validation', 'pass_single_seat');
      assert(e.includedInSubscription && sub && sub.status !== 'expired' && sub.visitsUsed < sub.visitsLimit, 'subscription_required');
      viaSubscription = true;
    }
    // Бесплатно или по подписке — сразу участник; платная — место держится до оплаты
    // (на бэкенде бронь без оплаты снимается по таймауту, например через 15 минут).
    const booking: Booking = {
      id: uid('b'),
      eventId,
      userId: me.id,
      status: e.priceKzt === 0 || viaSubscription ? 'confirmed' : 'pending_payment',
      viaSubscription,
      seats,
      code: ticketCode(),
      createdAt: now(),
    };
    db.bookings.push(booking);
    db.waitlist = db.waitlist.filter((w) => !(w.eventId === eventId && w.userId === me.id));
    if (booking.status === 'confirmed') notify(db, me.id, 'booking_confirmed', { title: e.title, time: e.startsAt }, eventLink(e.id));
    await save();
    return booking;
  },

  async payBooking(bookingId, payment) {
    const db = await loadDb();
    const me = await currentUser(db);
    const b = db.bookings.find((x) => x.id === bookingId && x.userId === me.id);
    assert(b && b.status === 'pending_payment', 'not_found');
    const e = db.events.find((x) => x.id === b.eventId)!;
    await charge(db, me, 'booking', e.priceKzt * b.seats, payment);
    b.status = 'confirmed';
    notify(db, me.id, 'booking_confirmed', { title: e.title, time: e.startsAt }, eventLink(e.id));
    await save();
    return { ...b };
  },

  async cancelBooking(bookingId) {
    await delay();
    const db = await loadDb();
    const me = await currentUser(db);
    const b = db.bookings.find((x) => x.id === bookingId && x.userId === me.id);
    assert(b && isActive(b), 'not_found');
    const e = db.events.find((x) => x.id === b.eventId)!;
    const late = new Date(e.startsAt).getTime() - Date.now() < LATE_CANCEL_HOURS * HOUR;
    // Поздняя отмена записи по подписке: место освобождается, но посещение списано.
    b.status = b.viaSubscription && late ? 'cancelled_late' : 'cancelled';
    promoteWaitlist(db, e);
    await save();
  },

  async joinWaitlist(eventId) {
    await delay();
    const db = await loadDb();
    const me = await currentUser(db);
    const e = db.events.find((x) => x.id === eventId);
    assert(e && e.status === 'published', 'not_found');
    assert(seatsTaken(db, e) >= e.capacity, 'validation', 'not_full');
    if (!db.waitlist.some((w) => w.eventId === eventId && w.userId === me.id)) {
      db.waitlist.push({ eventId, userId: me.id, createdAt: now() });
      await save();
    }
  },

  async leaveWaitlist(eventId) {
    await delay();
    const db = await loadDb();
    const me = await currentUser(db);
    db.waitlist = db.waitlist.filter((w) => !(w.eventId === eventId && w.userId === me.id));
    await save();
  },

  async listParticipants(eventId) {
    await delay();
    const db = await loadDb();
    const me = await currentUser(db);
    const e = db.events.find((x) => x.id === eventId);
    assert(e && canManageEvent(db, e, me.id), 'forbidden');
    return db.bookings
      .filter((b) => b.eventId === eventId && b.status !== 'cancelled')
      .map((b) => toParticipant(db, b, e));
  },

  async checkIn(eventId, code) {
    await delay(300);
    const db = await loadDb();
    const me = await currentUser(db);
    const e = db.events.find((x) => x.id === eventId);
    assert(e && canManageEvent(db, e, me.id), 'forbidden');
    // QR-билет: LS:<bookingId>:<code>; вручную — 6 символов кода.
    const raw = code.trim().toUpperCase();
    const fromQr = /^LS:([^:]+):([A-Z0-9]{6})$/i.exec(code.trim());
    const b = db.bookings.find(
      (x) => x.eventId === eventId && (fromQr ? x.id === fromQr[1] && x.code === fromQr[2].toUpperCase() : x.code === raw),
    );
    assert(b && b.status === 'confirmed', 'not_found', 'ticket');
    const alreadyCheckedIn = !!b.checkedInAt;
    b.checkedInAt ??= now();
    await save();
    return { ...toParticipant(db, b, e), alreadyCheckedIn };
  },

  async orgStats(orgId) {
    await delay();
    const db = await loadDb();
    const me = await currentUser(db);
    const org = db.organizations.find((o) => o.id === orgId);
    assert(org && org.ownerId === me.id, 'forbidden');
    const events = db.events
      .filter((e) => e.host.type === 'organization' && e.host.id === orgId)
      .sort((a, b) => b.startsAt.localeCompare(a.startsAt))
      .map((e) => {
        const list = db.bookings.filter((b) => b.eventId === e.id);
        const confirmed = list.filter((b) => b.status === 'confirmed');
        const paidSeats = confirmed.filter((b) => !b.viaSubscription).reduce((n, b) => n + b.seats, 0);
        const passVisits = list.filter((b) => b.viaSubscription && b.status !== 'cancelled').length;
        const revenueKzt = paidSeats * e.priceKzt;
        return {
          id: e.id,
          title: e.title,
          startsAt: e.startsAt,
          status: e.status,
          seats: confirmed.reduce((n, b) => n + b.seats, 0),
          capacity: e.capacity,
          checkedIn: confirmed.filter((b) => b.checkedInAt).length,
          revenueKzt,
          passVisits,
          // Выплата: билеты целиком + компенсация за визиты по подписке
          payoutKzt: revenueKzt + Math.round(passVisits * e.priceKzt * PASS_PAYOUT_SHARE),
        };
      });
    const sum = (k: 'seats' | 'checkedIn' | 'revenueKzt' | 'passVisits' | 'payoutKzt') => events.reduce((n, x) => n + x[k], 0);
    return {
      totals: {
        events: events.length,
        seats: sum('seats'),
        checkedIn: sum('checkedIn'),
        revenueKzt: sum('revenueKzt'),
        passVisits: sum('passVisits'),
        payoutKzt: sum('payoutKzt'),
      },
      events,
    };
  },

  async listReviews(host) {
    await delay();
    const db = await loadDb();
    return db.reviews
      .filter((r) => r.host.type === host.type && r.host.id === host.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async createReview(eventId, rating, text) {
    await delay();
    const db = await loadDb();
    const me = await currentUser(db);
    const e = db.events.find((x) => x.id === eventId);
    assert(e, 'not_found');
    // Отзыв — только участник и только после начала встречи.
    const attended = db.bookings.some((b) => b.eventId === eventId && b.userId === me.id && b.status === 'confirmed');
    assert(attended && new Date(e.startsAt).getTime() < Date.now(), 'forbidden');
    assert(!db.reviews.some((r) => r.eventId === eventId && r.userId === me.id), 'already_reviewed');
    assert(Number.isInteger(rating) && rating >= 1 && rating <= 5 && text.length <= 1000, 'validation', 'review');
    const review = {
      id: uid('r'),
      eventId,
      eventTitle: e.title,
      host: e.host,
      userId: me.id,
      userName: me.name,
      rating,
      text: text.trim(),
      createdAt: now(),
    };
    db.reviews.push(review);
    await save();
    return review;
  },

  async getUserProfile(userId) {
    await delay();
    const db = await loadDb();
    const me = await currentUser(db);
    const u = db.users.find((x) => x.id === userId);
    // Если пользователь заблокировал меня — его профиль для меня «не существует».
    if (!u || db.blocks.some((x) => x.by === userId && x.target === me.id)) return null;
    const f = db.friendships.find((x) => (x.from === me.id && x.to === userId) || (x.from === userId && x.to === me.id));
    const friendship =
      userId === me.id ? 'self' : !f ? 'none' : f.status === 'accepted' ? 'friends' : f.from === me.id ? 'outgoing' : 'incoming';
    const attended = db.bookings
      .filter((b) => b.userId === userId && b.status === 'confirmed')
      .map((b) => db.events.find((e) => e.id === b.eventId)!)
      .filter((e) => e && new Date(e.startsAt).getTime() < Date.now());
    const visible = friendship === 'friends' || friendship === 'self';
    return {
      id: u.id,
      name: u.name,
      cityId: u.cityId,
      interests: u.interests,
      friendship,
      blocked: db.blocks.some((x) => x.by === me.id && x.target === userId),
      attendedCount: attended.length,
      friendsCount: friendIds(db, u.id).length,
      communities: db.members
        .filter((m) => m.userId === userId)
        .map((m) => db.communities.find((c) => c.id === m.communityId)!)
        .filter(Boolean)
        .map((c) => ({ id: c.id, name: c.name })),
      recentEvents: visible
        ? attended
            .sort((a, b) => b.startsAt.localeCompare(a.startsAt))
            .slice(0, 5)
            .map((e) => ({ id: e.id, title: e.title, startsAt: e.startsAt }))
        : null,
    };
  },

  async listFriends() {
    await delay();
    const db = await loadDb();
    const me = await currentUser(db);
    // «Важные» — топ-5 друзей по числу сообщений в личке за 30 дней (в обе стороны).
    const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const counts = friendIds(db, me.id).map((fid) => {
      const conv = findConversation(db, me.id, fid);
      const messages30d = conv ? db.directMessages.filter((m) => m.conversationId === conv.id && m.createdAt >= since).length : 0;
      return { ...person(db, fid), messages30d };
    });
    const top = new Set(
      [...counts]
        .filter((f) => f.messages30d > 0)
        .sort((a, b) => b.messages30d - a.messages30d)
        .slice(0, 5)
        .map((f) => f.id),
    );
    return counts
      .map((f): Friend => ({ ...f, important: top.has(f.id) }))
      .sort((a, b) => Number(b.important) - Number(a.important) || b.messages30d - a.messages30d || a.name.localeCompare(b.name));
  },

  async removeFriend(userId) {
    await delay();
    const db = await loadDb();
    const me = await currentUser(db);
    db.friendships = db.friendships.filter((f) => !((f.from === me.id && f.to === userId) || (f.from === userId && f.to === me.id)));
    await save();
  },

  async blockUser(userId) {
    await delay();
    const db = await loadDb();
    const me = await currentUser(db);
    assert(userId !== me.id && db.users.some((u) => u.id === userId), 'not_found');
    if (!db.blocks.some((x) => x.by === me.id && x.target === userId)) db.blocks.push({ by: me.id, target: userId, createdAt: now() });
    // Блокировка разрывает дружбу и отменяет заявки в обе стороны.
    db.friendships = db.friendships.filter((f) => !((f.from === me.id && f.to === userId) || (f.from === userId && f.to === me.id)));
    await save();
  },

  async unblockUser(userId) {
    await delay();
    const db = await loadDb();
    const me = await currentUser(db);
    db.blocks = db.blocks.filter((x) => !(x.by === me.id && x.target === userId));
    await save();
  },

  async listBlocked() {
    await delay();
    const db = await loadDb();
    const me = await currentUser(db);
    return db.blocks.filter((x) => x.by === me.id).map((x) => person(db, x.target));
  },

  async listConversations() {
    await delay(150);
    const db = await loadDb();
    const me = await currentUser(db);
    return db.conversations
      .filter((c) => c.members.includes(me.id) && db.directMessages.some((m) => m.conversationId === c.id))
      .map((c) => toConversation(db, c, me.id))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  async openConversation(userId) {
    await delay(150);
    const db = await loadDb();
    const me = await currentUser(db);
    assert(userId !== me.id && db.users.some((u) => u.id === userId), 'not_found');
    assert(!db.blocks.some((x) => x.by === userId && x.target === me.id), 'not_found');
    let c = findConversation(db, me.id, userId);
    if (!c) {
      c = { id: uid('dm'), members: [me.id, userId], createdAt: now(), lastRead: {} };
      db.conversations.push(c);
      await save();
    }
    return toConversation(db, c, me.id);
  },

  async getConversation(conversationId) {
    await delay(100);
    const db = await loadDb();
    const me = await currentUser(db);
    const c = db.conversations.find((x) => x.id === conversationId && x.members.includes(me.id));
    return c ? toConversation(db, c, me.id) : null;
  },

  async listDirectMessages(conversationId) {
    await delay(120);
    const db = await loadDb();
    const me = await currentUser(db);
    const c = db.conversations.find((x) => x.id === conversationId);
    assert(c && c.members.includes(me.id), 'forbidden');
    return db.directMessages
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 200);
  },

  async sendDirectMessage(conversationId, message) {
    await delay(200);
    const db = await loadDb();
    const me = await currentUser(db);
    const c = db.conversations.find((x) => x.id === conversationId);
    assert(c && c.members.includes(me.id), 'forbidden');
    const text = message.text.trim();
    assert(text.length > 0 || message.attachments.length > 0, 'validation', 'empty');
    assert(text.length <= 4000 && message.attachments.length <= 10, 'validation', 'too_long');
    const peerId = c.members.find((x) => x !== me.id)!;
    assert(!blockedEither(db, me.id, peerId), 'forbidden', 'blocked');
    const isFirst = !db.directMessages.some((m) => m.conversationId === c.id && m.authorId === me.id);
    const msg: DirectMessage = {
      id: uid('dmm'),
      conversationId,
      authorId: me.id,
      authorName: me.name,
      text,
      attachments: message.attachments,
      createdAt: now(),
    };
    db.directMessages.push(msg);
    c.lastRead[me.id] = msg.createdAt;
    // На бэкенде — push получателю; здесь уведомление попадёт в его ленту.
    notify(db, peerId, 'direct_message', { name: me.name }, { pathname: '/messages/[id]', params: { id: c.id } });
    await save();
    if (isFirst && SEED_USERS.has(peerId)) scheduleDirectReply(db, c.id, peerId, me.id);
    return msg;
  },

  async deleteDirectMessage(messageId) {
    await delay();
    const db = await loadDb();
    const me = await currentUser(db);
    const m = db.directMessages.find((x) => x.id === messageId);
    assert(m && m.authorId === me.id, 'forbidden');
    db.directMessages = db.directMessages.filter((x) => x !== m);
    await save();
  },

  async markConversationRead(conversationId) {
    const db = await loadDb();
    const me = await currentUser(db);
    const c = db.conversations.find((x) => x.id === conversationId && x.members.includes(me.id));
    if (!c) return;
    c.lastRead[me.id] = now();
    await save();
  },

  async sendFriendRequest(userId) {
    await delay();
    const db = await loadDb();
    const me = await currentUser(db);
    assert(userId !== me.id && db.users.some((u) => u.id === userId), 'not_found');
    assert(!blockedEither(db, me.id, userId), 'forbidden', 'blocked');
    const existing = db.friendships.find((x) => (x.from === me.id && x.to === userId) || (x.from === userId && x.to === me.id));
    if (existing) {
      // Встречная заявка — сразу дружба.
      if (existing.status === 'pending' && existing.from === userId) existing.status = 'accepted';
      await save();
      return;
    }
    const f = { from: me.id, to: userId, status: 'pending' as 'pending' | 'accepted' };
    db.friendships.push(f);
    notify(db, userId, 'friend_request', { name: me.name }, { pathname: '/user/[id]', params: { id: me.id } });
    await save();
    if (SEED_USERS.has(userId)) {
      setTimeout(() => {
        f.status = 'accepted';
        notify(db, me.id, 'friend_accepted', { name: person(db, userId).name }, { pathname: '/user/[id]', params: { id: userId } });
        save();
      }, 2000);
    }
  },

  async respondFriendRequest(userId, accept) {
    await delay();
    const db = await loadDb();
    const me = await currentUser(db);
    const f = db.friendships.find((x) => x.from === userId && x.to === me.id && x.status === 'pending');
    assert(f, 'not_found');
    if (accept) {
      f.status = 'accepted';
      notify(db, userId, 'friend_accepted', { name: me.name }, { pathname: '/user/[id]', params: { id: me.id } });
    } else {
      db.friendships = db.friendships.filter((x) => x !== f);
    }
    await save();
  },

  async listNotifications() {
    await delay(150);
    const db = await loadDb();
    const me = await currentUser(db);
    materializeScheduled(db, me.id);
    await save();
    return db.notifications
      .filter((n) => n.userId === me.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 100)
      .map(({ userId: _u, ...n }) => n);
  },

  async markNotificationsRead() {
    const db = await loadDb();
    const me = await currentUser(db);
    const t = now();
    db.notifications.filter((n) => n.userId === me.id && !n.readAt).forEach((n) => (n.readAt = t));
    await save();
  },

  async mySubscription() {
    await delay();
    const db = await loadDb();
    return currentSubscription(db, (await currentUser(db)).id);
  },

  async subscribe(payment) {
    const db = await loadDb();
    const me = await currentUser(db);
    const current = currentSubscription(db, me.id);
    assert(!current || current.status === 'expired', 'validation', 'already_subscribed');
    await charge(db, me, 'subscription', PASS_PLAN.priceKzt, payment);
    const start = new Date();
    db.subscriptions.push({
      id: uid('sub'),
      userId: me.id,
      planId: PASS_PLAN.id,
      status: 'active',
      startedAt: start.toISOString(),
      endsAt: new Date(start.getTime() + PASS_PLAN.periodDays * 86_400_000).toISOString(),
      visitsUsed: 0,
      visitsLimit: PASS_PLAN.visitsLimit,
    });
    await save();
    return currentSubscription(db, me.id)!;
  },

  async cancelSubscription() {
    await delay();
    const db = await loadDb();
    const me = await currentUser(db);
    const sub = db.subscriptions.filter((x) => x.userId === me.id).sort((a, b) => b.endsAt.localeCompare(a.endsAt))[0];
    assert(sub, 'not_found');
    sub.status = 'cancelled';
    await save();
    return currentSubscription(db, me.id)!;
  },

  async myOrganizations() {
    await delay();
    const db = await loadDb();
    const me = await currentUser(db);
    return db.organizations.filter((o) => o.ownerId === me.id).map((o) => toOrganization(db, o));
  },

  async getOrganization(id) {
    await delay();
    const db = await loadDb();
    const o = db.organizations.find((x) => x.id === id);
    return o ? toOrganization(db, o) : null;
  },

  async createOrganization(input) {
    await delay(500);
    const db = await loadDb();
    const me = await currentUser(db);
    assert(input.name.trim().length >= 2, 'validation', 'name');
    assert(/^\d{12}$/.test(input.bin), 'validation', 'bin');
    // Новая организация уходит на модерацию: проверка БИН/ИИН и документов.
    const org: DbOrganization = {
      ...input,
      name: input.name.trim(),
      id: uid('o'),
      status: 'pending',
      // Точку на карте уточнит геокодер (2GIS) на бэкенде; пока — центр города.
      location: getCity(input.cityId).center,
      ownerId: me.id,
      createdAt: now(),
    };
    db.organizations.push(org);
    await save();
    return toOrganization(db, org);
  },

  async listCommunities({ cityId, interestId, query }) {
    await delay();
    const db = await loadDb();
    const me = await currentUser(db).catch(() => null);
    const q = query?.trim().toLowerCase();
    return db.communities
      .filter(
        (c) =>
          c.cityId === cityId &&
          (!interestId || c.interests.includes(interestId)) &&
          (!q || c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)),
      )
      .map((c) => toCommunity(db, c, me?.id ?? null))
      .sort((a, b) => b.membersCount - a.membersCount);
  },

  async myCommunities() {
    await delay();
    const db = await loadDb();
    const me = await currentUser(db);
    const ids = new Set(db.members.filter((m) => m.userId === me.id).map((m) => m.communityId));
    return db.communities.filter((c) => ids.has(c.id)).map((c) => toCommunity(db, c, me.id));
  },

  async getCommunity(id) {
    await delay();
    const db = await loadDb();
    const me = await currentUser(db).catch(() => null);
    const c = db.communities.find((x) => x.id === id);
    return c ? toCommunity(db, c, me?.id ?? null) : null;
  },

  async createCommunity(input) {
    await delay(400);
    const db = await loadDb();
    const me = await currentUser(db);
    assert(input.name.trim().length >= 3, 'validation', 'name');
    assert(input.interests.length > 0, 'validation', 'interests');
    const c: DbCommunity = {
      ...input,
      name: input.name.trim(),
      description: input.description.trim(),
      id: uid('c'),
      ownerId: me.id,
      seedMembers: 1,
      createdAt: now(),
    };
    db.communities.push(c);
    db.members.push({ communityId: c.id, userId: me.id, role: 'owner' });
    await save();
    return toCommunity(db, c, me.id);
  },

  async joinCommunity(id) {
    await delay();
    const db = await loadDb();
    const me = await currentUser(db);
    assert(db.communities.some((c) => c.id === id), 'not_found');
    if (!db.members.some((m) => m.communityId === id && m.userId === me.id)) {
      db.members.push({ communityId: id, userId: me.id, role: 'member' });
      await save();
    }
  },

  async leaveCommunity(id) {
    await delay();
    const db = await loadDb();
    const me = await currentUser(db);
    const m = db.members.find((x) => x.communityId === id && x.userId === me.id);
    // Владелец не может просто выйти — сначала передать права (на бэкенде отдельный метод).
    assert(m && m.role !== 'owner', 'forbidden', 'owner_cannot_leave');
    db.members = db.members.filter((x) => x !== m);
    await save();
  },

  async listPosts(communityId) {
    await delay();
    const db = await loadDb();
    return db.posts.filter((p) => p.communityId === communityId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async createPost(communityId, text) {
    await delay();
    const db = await loadDb();
    const me = await currentUser(db);
    const role = roleIn(db, communityId, me.id);
    assert(role === 'owner' || role === 'moderator', 'forbidden');
    const body = text.trim();
    assert(body.length > 0 && body.length <= 2000, 'validation', 'text');
    const post = { id: uid('p'), communityId, authorId: me.id, authorName: me.name, text: body, createdAt: now() };
    db.posts.push(post);
    await save();
    return post;
  },

  async listMessages(communityId) {
    await delay(150);
    const db = await loadDb();
    const me = await currentUser(db);
    assert(roleIn(db, communityId, me.id), 'forbidden');
    const hidden = blockedByMe(db, me.id);
    return db.messages
      .filter((m) => m.communityId === communityId && !hidden.has(m.authorId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 200);
  },

  async sendMessage(communityId, message) {
    await delay(200);
    const db = await loadDb();
    const me = await currentUser(db);
    assert(roleIn(db, communityId, me.id), 'forbidden');
    const text = message.text.trim();
    assert(text.length > 0 || message.attachments.length > 0, 'validation', 'empty');
    assert(text.length <= 4000 && message.attachments.length <= 10, 'validation', 'too_long');
    const isFirst = !db.messages.some((m) => m.communityId === communityId && m.authorId === me.id);
    const msg = { id: uid('m'), communityId, authorId: me.id, authorName: me.name, text, attachments: message.attachments, createdAt: now() };
    db.messages.push(msg);
    await save();
    if (isFirst) scheduleWelcome(db, communityId, me.id);
    return msg;
  },

  async deleteMessage(messageId) {
    await delay();
    const db = await loadDb();
    const me = await currentUser(db);
    const m = db.messages.find((x) => x.id === messageId);
    assert(m, 'not_found');
    const role = roleIn(db, m.communityId, me.id);
    // Удалить может автор, а модератор и владелец — любое сообщение в своём сообществе.
    assert(m.authorId === me.id || role === 'owner' || role === 'moderator', 'forbidden');
    db.messages = db.messages.filter((x) => x !== m);
    await save();
  },

  async uploadMedia(file) {
    await delay(150);
    // На бэкенде — подписанный URL объектного хранилища; в моке файл остаётся на устройстве.
    return { url: file.uri };
  },

  async report(target, targetId, reason) {
    await delay();
    const db = await loadDb();
    const me = await currentUser(db);
    db.reports.push({ target, targetId, reason, userId: me.id, createdAt: now() });
    await save();
  },
};

function toParticipant(db: Db, b: Booking, e: DbEvent): Participant {
  const u = db.users.find((x) => x.id === b.userId);
  return {
    bookingId: b.id,
    userId: b.userId,
    name: u?.name ?? '—',
    phoneMasked: u ? maskPhone(u.phone) : '',
    seats: b.seats,
    status: b.status,
    viaSubscription: b.viaSubscription,
    checkedInAt: b.checkedInAt,
    paidKzt: b.status === 'confirmed' && !b.viaSubscription ? e.priceKzt * b.seats : 0,
  };
}

/** Новая встреча → уведомление тем, у кого совпадает интерес и город. */
function announceNewEvent(db: Db, e: DbEvent) {
  for (const u of db.users) {
    if (u.id !== e.createdBy && u.cityId === e.cityId && u.interests.includes(e.interestId)) {
      notify(db, u.id, 'new_event', { title: e.title, time: e.startsAt }, eventLink(e.id));
    }
  }
}

type DbConversation = Db['conversations'][number];

function findConversation(db: Db, a: string, b: string): DbConversation | undefined {
  return db.conversations.find((c) => c.members.includes(a) && c.members.includes(b));
}

function toConversation(db: Db, c: DbConversation, meId: string): Conversation {
  const peerId = c.members.find((x) => x !== meId)!;
  const messages = db.directMessages.filter((m) => m.conversationId === c.id).sort((x, y) => y.createdAt.localeCompare(x.createdAt));
  const last = messages[0];
  const lastRead = c.lastRead[meId] ?? '';
  const kind = (m: DirectMessage) => (m.text ? 'text' : (m.attachments[0]?.kind ?? 'text'));
  return {
    id: c.id,
    peer: person(db, peerId),
    isFriend: friendIds(db, meId).includes(peerId),
    canMessage: !blockedEither(db, meId, peerId),
    blockedByMe: db.blocks.some((x) => x.by === meId && x.target === peerId),
    lastMessage: last ? { text: last.text, authorId: last.authorId, createdAt: last.createdAt, kind: kind(last) } : null,
    unread: messages.filter((m) => m.authorId !== meId && m.createdAt > lastRead).length,
    updatedAt: last?.createdAt ?? c.createdAt,
  };
}

// Демо: тестовые пользователи отвечают на первое личное сообщение.
const DIRECT_REPLIES = [
  'Привет! Рада знакомству. Идёшь на ближайшую игру?',
  'Привет! Да, давай. Увидимся на встрече!',
  'Здравствуй! Конечно, пиши, если что-то нужно по встречам.',
];

function scheduleDirectReply(db: Db, conversationId: string, fromId: string, toId: string) {
  setTimeout(() => {
    const author = person(db, fromId);
    db.directMessages.push({
      id: uid('dmm'),
      conversationId,
      authorId: fromId,
      authorName: author.name,
      text: DIRECT_REPLIES[fromId.length % DIRECT_REPLIES.length],
      attachments: [],
      createdAt: now(),
    });
    notify(db, toId, 'direct_message', { name: author.name }, { pathname: '/messages/[id]', params: { id: conversationId } });
    save();
  }, 2500);
}
