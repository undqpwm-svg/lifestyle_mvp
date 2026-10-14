import AsyncStorage from '@react-native-async-storage/async-storage';

import { ApiError, getAuthToken, type Api } from './api';
import { createSeed, type Db, type DbCommunity, type DbEvent } from './mock-seed';
import type { Booking, Community, EventItem, Organization, User } from './types';

// Тестовый «сервер» в памяти устройства. Повторяет бизнес-правила будущего бэкенда,
// чтобы UI можно было разрабатывать и показывать без сервера.
// Код подтверждения в моке всегда 1111.

const STORAGE_KEY = 'lifestyle.mockdb.v2';
const MOCK_OTP = '1111';
const TOKEN_PREFIX = 'mock-token:';
const RESEED_AFTER_MS = 3 * 86_400_000;

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

async function save() {
  const db = await loadDb();
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(db)).catch(() => {});
}

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));
const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const now = () => new Date().toISOString();

async function currentUser(db: Db): Promise<User> {
  const token = getAuthToken();
  const id = token?.startsWith(TOKEN_PREFIX) ? token.slice(TOKEN_PREFIX.length) : null;
  const user = id ? db.users.find((u) => u.id === id) : undefined;
  if (!user) throw new ApiError('unauthorized');
  return user;
}

// Проекции «таблиц» в DTO
function activeBookings(db: Db, eventId: string) {
  return db.bookings.filter((b) => b.eventId === eventId && b.status !== 'cancelled');
}

function toEvent(db: Db, e: DbEvent, userId: string | null): EventItem {
  const host =
    e.host.type === 'organization'
      ? db.organizations.find((o) => o.id === e.host.id)
      : db.communities.find((c) => c.id === e.host.id);
  const { seedBooked, ...rest } = e;
  return {
    ...rest,
    host: {
      ...e.host,
      name: host?.name ?? '—',
      verified: e.host.type === 'organization' && (host as Organization | undefined)?.status === 'verified',
    },
    bookedCount: seedBooked + activeBookings(db, e.id).length,
    myBooking: userId ? (activeBookings(db, e.id).find((b) => b.userId === userId) ?? null) : null,
  };
}

function toCommunity(db: Db, c: DbCommunity, userId: string | null): Community {
  const { seedMembers, ...rest } = c;
  const members = db.members.filter((m) => m.communityId === c.id);
  return {
    ...rest,
    membersCount: seedMembers + members.filter((m) => m.userId !== c.ownerId).length,
    myRole: members.find((m) => m.userId === userId)?.role ?? null,
  };
}

function assert(cond: unknown, code: ConstructorParameters<typeof ApiError>[0], msg?: string): asserts cond {
  if (!cond) throw new ApiError(code, msg);
}

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
      user = { id: uid('u'), phone, name: '', cityId: 'astana', interests: [], createdAt: now() };
      db.users.push(user);
      await save();
    }
    return { token: TOKEN_PREFIX + user.id, user, isNew };
  },

  async me() {
    return currentUser(await loadDb());
  },

  async updateProfile(input) {
    await delay();
    const db = await loadDb();
    const user = await currentUser(db);
    assert(input.name.trim().length >= 2, 'validation', 'name');
    Object.assign(user, { ...input, name: input.name.trim() });
    await save();
    return { ...user };
  },

  async listEvents(f) {
    await delay();
    const db = await loadDb();
    const me = await currentUser(db).catch(() => null);
    const from = Date.now() - 3 * 3_600_000; // показываем и начавшиеся недавно
    return db.events
      .filter(
        (e) =>
          e.status === 'published' &&
          e.cityId === f.cityId &&
          new Date(e.startsAt).getTime() > from &&
          (!f.interestId || e.interestId === f.interestId) &&
          (!f.hostType || e.host.type === f.hostType) &&
          (!f.hostId || e.host.id === f.hostId),
      )
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
      .map((e) => toEvent(db, e, me?.id ?? null));
  },

  async getEvent(id) {
    await delay();
    const db = await loadDb();
    const me = await currentUser(db).catch(() => null);
    const e = db.events.find((x) => x.id === id);
    return e ? toEvent(db, e, me?.id ?? null) : null;
  },

  async createEvent(input) {
    await delay(400);
    const db = await loadDb();
    const me = await currentUser(db);
    let cityId: DbEvent['cityId'];

    // Права: организация — только владелец; сообщество — владелец или модератор.
    if (input.host.type === 'organization') {
      const org = db.organizations.find((o) => o.id === input.host.id);
      assert(org && org.ownerId === me.id, 'forbidden');
      assert(org.status !== 'rejected', 'forbidden', 'org_rejected');
      // Принимать оплату может только проверенная организация (есть договор и реквизиты).
      assert(input.priceKzt === 0 || org.status === 'verified', 'forbidden', 'paid_requires_verified');
      cityId = org.cityId;
    } else {
      const c = db.communities.find((x) => x.id === input.host.id);
      const role = db.members.find((m) => m.communityId === input.host.id && m.userId === me.id)?.role;
      assert(c && (role === 'owner' || role === 'moderator'), 'forbidden');
      assert(input.priceKzt === 0, 'forbidden', 'paid_requires_verified');
      cityId = c.cityId;
    }
    assert(input.title.trim().length >= 3, 'validation', 'title');
    assert(input.capacity >= 2 && input.capacity <= 1000, 'validation', 'capacity');
    assert(new Date(input.startsAt).getTime() > Date.now(), 'validation', 'startsAt');

    const e: DbEvent = {
      ...input,
      id: uid('e'),
      cityId,
      title: input.title.trim(),
      description: input.description.trim(),
      seedBooked: 0,
      status: 'published',
      createdBy: me.id,
    };
    db.events.push(e);
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
    // Брони отменяются; на бэкенде — ещё и возврат денег через Kaspi.
    db.bookings.filter((b) => b.eventId === id).forEach((b) => (b.status = 'cancelled'));
    await save();
  },

  async myBookings() {
    await delay();
    const db = await loadDb();
    const me = await currentUser(db);
    return db.bookings
      .filter((b) => b.userId === me.id && b.status !== 'cancelled')
      .map((b) => ({ ...b, event: toEvent(db, db.events.find((e) => e.id === b.eventId)!, me.id) }))
      .sort((a, b) => a.event.startsAt.localeCompare(b.event.startsAt));
  },

  async book(eventId) {
    await delay(400);
    const db = await loadDb();
    const me = await currentUser(db);
    const e = db.events.find((x) => x.id === eventId);
    assert(e && e.status === 'published', 'not_found');
    const existing = activeBookings(db, eventId).find((b) => b.userId === me.id);
    if (existing) return existing;
    assert(e.seedBooked + activeBookings(db, eventId).length < e.capacity, 'event_full');
    // Бесплатная встреча — сразу участник; платная — место держится до оплаты
    // (на бэкенде бронь без оплаты снимается по таймауту, например через 15 минут).
    const booking: Booking = {
      id: uid('b'),
      eventId,
      userId: me.id,
      status: e.priceKzt === 0 ? 'confirmed' : 'pending_payment',
      createdAt: now(),
    };
    db.bookings.push(booking);
    await save();
    return booking;
  },

  async payBooking(bookingId) {
    await delay(800);
    const db = await loadDb();
    const me = await currentUser(db);
    const b = db.bookings.find((x) => x.id === bookingId && x.userId === me.id);
    assert(b && b.status === 'pending_payment', 'not_found');
    b.status = 'confirmed';
    await save();
    return { ...b };
  },

  async cancelBooking(bookingId) {
    await delay();
    const db = await loadDb();
    const me = await currentUser(db);
    const b = db.bookings.find((x) => x.id === bookingId && x.userId === me.id);
    assert(b, 'not_found');
    b.status = 'cancelled';
    await save();
  },

  async myOrganizations() {
    await delay();
    const db = await loadDb();
    const me = await currentUser(db);
    return db.organizations.filter((o) => o.ownerId === me.id);
  },

  async getOrganization(id) {
    await delay();
    return (await loadDb()).organizations.find((o) => o.id === id) ?? null;
  },

  async createOrganization(input) {
    await delay(500);
    const db = await loadDb();
    const me = await currentUser(db);
    assert(input.name.trim().length >= 2, 'validation', 'name');
    assert(/^\d{12}$/.test(input.bin), 'validation', 'bin');
    // Новая организация уходит на модерацию: проверка БИН/ИИН и документов.
    const org: Organization = { ...input, name: input.name.trim(), id: uid('o'), status: 'pending', ownerId: me.id, createdAt: now() };
    db.organizations.push(org);
    await save();
    return org;
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
    assert(!input.telegramUrl || /^https:\/\/t\.me\/[\w+/-]+$/.test(input.telegramUrl), 'validation', 'telegramUrl');
    const c: DbCommunity = {
      ...input,
      name: input.name.trim(),
      description: input.description.trim(),
      telegramUrl: input.telegramUrl || undefined,
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
    return db.posts
      .filter((p) => p.communityId === communityId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async createPost(communityId, text) {
    await delay();
    const db = await loadDb();
    const me = await currentUser(db);
    assert(db.members.some((m) => m.communityId === communityId && m.userId === me.id), 'forbidden');
    const body = text.trim();
    assert(body.length > 0 && body.length <= 2000, 'validation', 'text');
    const post = { id: uid('p'), communityId, authorId: me.id, authorName: me.name, text: body, createdAt: now() };
    db.posts.push(post);
    await save();
    return post;
  },

  async report(target, targetId, reason) {
    await delay();
    const db = await loadDb();
    const me = await currentUser(db);
    db.reports.push({ target, targetId, reason, userId: me.id, createdAt: now() });
    await save();
  },
};
