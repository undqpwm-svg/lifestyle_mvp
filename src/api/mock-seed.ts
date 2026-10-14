import type { CityId } from '@/config/cities';

import { pexels } from '@/lib/media';

import type {
  AppNotification,
  Booking,
  ChatMessage,
  CommunityRole,
  DirectMessage,
  GeoPoint,
  InterestId,
  Organization,
  Payment,
  Post,
  Review,
  Subscription,
  User,
} from './types';

// Начальные данные тестового сервера. Даты считаются от текущего момента.

export type DbEvent = {
  id: string;
  cityId: CityId;
  interestId: InterestId;
  title: string;
  description: string;
  coverUrl?: string;
  host: { type: 'organization' | 'community'; id: string };
  venue: string;
  address: string;
  location: GeoPoint;
  promotedUntil?: string;
  startsAt: string;
  durationMin: number;
  priceKzt: number;
  capacity: number;
  /** Участники, записанные «до» тестовых данных (в реальной БД — из bookings) */
  seedBooked: number;
  includedInSubscription: boolean;
  status: 'awaiting_payment' | 'published' | 'cancelled';
  createdBy: string;
};

export type DbCommunity = {
  id: string;
  name: string;
  description: string;
  cityId: CityId;
  interests: InterestId[];
  ownerId: string;
  coverUrl?: string;
  seedMembers: number;
  createdAt: string;
};

export type DbMember = { communityId: string; userId: string; role: CommunityRole };

export type DbUser = User & { referredBy?: string };
export type DbOrganization = Omit<Organization, 'rating'>;

export type Db = {
  version: 1;
  users: DbUser[];
  organizations: DbOrganization[];
  communities: DbCommunity[];
  members: DbMember[];
  events: DbEvent[];
  bookings: Booking[];
  posts: Post[];
  messages: ChatMessage[];
  payments: (Payment & { userId: string })[];
  subscriptions: (Subscription & { userId: string })[];
  reports: { target: string; targetId: string; reason: string; userId: string; createdAt: string }[];
  waitlist: { eventId: string; userId: string; createdAt: string }[];
  reviews: Review[];
  /** Заявка from → to; accepted — дружба взаимная */
  friendships: { from: string; to: string; status: 'pending' | 'accepted' }[];
  notifications: (AppNotification & { userId: string })[];
  pushTokens: { userId: string; token: string }[];
  /** Уже созданные «отложенные» уведомления (напоминания, просьбы об отзыве), чтобы не дублировать */
  notified: string[];
  conversations: { id: string; members: [string, string]; createdAt: string; lastRead: Record<string, string> }[];
  directMessages: DirectMessage[];
  /** by заблокировал target */
  blocks: { by: string; target: string; createdAt: string }[];
};

function at(dayOffset: number, hour: number, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

const ago = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString();
const inHours = (hours: number) => new Date(Date.now() + hours * 3_600_000).toISOString();

/** Код билета: 6 символов без похожих букв/цифр (0/O, 1/I) */
export function ticketCode(): string {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => abc[Math.floor(Math.random() * abc.length)]).join('');
}

export function createSeed(): Db {
  const users: DbUser[] = [
    { id: 'u-aman', phone: '+77010000001', name: 'Аман Б.', cityId: 'astana', interests: ['volleyball'], referralCode: 'AMAN', bonusKzt: 0, createdAt: ago(900) },
    { id: 'u-dana', phone: '+77010000002', name: 'Дана К.', cityId: 'astana', interests: ['running', 'walks'], referralCode: 'DANA', bonusKzt: 0, createdAt: ago(800) },
    { id: 'u-erlan', phone: '+77010000003', name: 'Ерлан М.', cityId: 'astana', interests: ['boardgames', 'mafia'], referralCode: 'ERLAN', bonusKzt: 0, createdAt: ago(700) },
    { id: 'u-aliya', phone: '+77010000004', name: 'Алия Л.', cityId: 'almaty', interests: ['tech'], referralCode: 'ALIYA', bonusKzt: 0, createdAt: ago(600) },
  ];

  const organizations: DbOrganization[] = [
    {
      id: 'o-pizza', location: { lat: 51.1283, lng: 71.4305 }, coverUrl: pexels(1028434), name: 'Pizza Point', type: 'cafe', cityId: 'astana', address: 'Астана, ул. Достык, 5',
      description: 'Неаполитанская пицца на дровах. Проводим мастер-классы для взрослых и детей.',
      bin: '220740027686', status: 'verified', ownerId: 'u-dana', createdAt: ago(500),
    },
    {
      id: 'o-arena', location: { lat: 51.1088, lng: 71.4041 }, coverUrl: pexels(2874717), name: 'Qazaq Arena', type: 'sports', cityId: 'astana', address: 'Астана, ул. Туран, 57',
      description: 'Крытые поля для футбола и баскетбола, аренда и любительские игры.',
      bin: '190340011223', status: 'verified', ownerId: 'u-aman', createdAt: ago(480),
    },
    {
      id: 'o-mafia', location: { lat: 51.1652, lng: 71.4256 }, coverUrl: pexels(8111364), name: 'Mafia Club Astana', type: 'club', cityId: 'astana', address: 'Астана, пр. Республики, 24',
      description: 'Спортивная и городская мафия с профессиональными ведущими.',
      bin: '210540098765', status: 'verified', ownerId: 'u-erlan', createdAt: ago(470),
    },
    {
      id: 'o-padel', location: { lat: 43.2081, lng: 76.8941 }, coverUrl: pexels(32474981), name: 'Padel Club Almaty', type: 'sports', cityId: 'almaty', address: 'Алматы, ул. Розыбакиева, 247',
      description: 'Шесть кортов для падела, тренеры, турниры по выходным.',
      bin: '200840055667', status: 'verified', ownerId: 'u-aliya', createdAt: ago(460),
    },
  ];

  const communities: DbCommunity[] = [
    {
      id: 'c-volley', coverUrl: pexels(6203541), name: 'Волейбол Астана', cityId: 'astana', interests: ['volleyball'], ownerId: 'u-aman',
      description: 'Играем 3 раза в неделю, уровень от новичка до любителя. Новичкам рады!', seedMembers: 214, createdAt: ago(400),
    },
    {
      id: 'c-boardgames', coverUrl: pexels(8111356), name: 'Настолки по пятницам', cityId: 'astana', interests: ['boardgames', 'mafia'], ownerId: 'u-erlan',
      description: 'Собираемся каждую пятницу: Каркассон, Codenames, Root. Приносите свои игры.',
      seedMembers: 87, createdAt: ago(300),
    },
    {
      id: 'c-run', coverUrl: pexels(5319373), name: 'Бегуны Есиля', cityId: 'astana', interests: ['running', 'walks'], ownerId: 'u-dana',
      description: 'Утренние пробежки 5–10 км по набережной. Темп комфортный, никого не бросаем.',
      seedMembers: 132, createdAt: ago(200),
    },
    {
      id: 'c-it', coverUrl: pexels(1595385), name: 'IT-завтраки Алматы', cityId: 'almaty', interests: ['tech'], ownerId: 'u-aliya',
      description: 'Разработчики, продакты и дизайнеры. Кофе, доклады на 15 минут, нетворкинг.',
      seedMembers: 356, createdAt: ago(150),
    },
  ];

  const members: DbMember[] = [
    ...communities.map((c) => ({ communityId: c.id, userId: c.ownerId, role: 'owner' as const })),
    { communityId: 'c-volley', userId: 'u-dana', role: 'member' },
    { communityId: 'c-volley', userId: 'u-erlan', role: 'moderator' },
    { communityId: 'c-boardgames', userId: 'u-aman', role: 'member' },
    { communityId: 'c-run', userId: 'u-aman', role: 'member' },
  ];

  const events: DbEvent[] = [
    {
      id: 'e-pizza', location: { lat: 51.1283, lng: 71.4305 }, coverUrl: pexels(4071399), cityId: 'astana', interestId: 'cooking', host: { type: 'organization', id: 'o-pizza' },
      title: 'Мастер-класс: неаполитанская пицца',
      description: 'Шеф покажет, как замесить тесто и выпечь пиццу в дровяной печи. Готовите сами, свою пиццу забираете с собой.',
      venue: 'Pizza Point', address: 'Астана, ул. Достык, 5', startsAt: at(2, 18), durationMin: 120,
      priceKzt: 8000, capacity: 12, seedBooked: 9, includedInSubscription: false, status: 'published', createdBy: 'u-dana',
    },
    {
      id: 'e-volley', location: { lat: 51.1186, lng: 71.4483 }, coverUrl: pexels(6203560), cityId: 'astana', interestId: 'volleyball', host: { type: 'community', id: 'c-volley' },
      title: 'Волейбол: вечерняя игра',
      description: 'Смешанные команды, уровень — любитель. Мячи есть, нужна только форма.',
      venue: 'Дворец спорта', address: 'Астана, пр. Кабанбай батыра, 45', startsAt: at(0, 19), durationMin: 120,
      priceKzt: 0, capacity: 12, seedBooked: 8, includedInSubscription: false, status: 'published', createdBy: 'u-aman',
    },
    {
      id: 'e-football', location: { lat: 51.1088, lng: 71.4041 }, coverUrl: pexels(3316945), cityId: 'astana', interestId: 'football', host: { type: 'organization', id: 'o-arena' },
      title: 'Футбол 6×6', description: 'Крытое поле, манишки выдаём. Три тайма по 30 минут.',
      venue: 'Qazaq Arena', address: 'Астана, ул. Туран, 57', startsAt: at(1, 18, 30), durationMin: 90,
      priceKzt: 2500, capacity: 12, seedBooked: 10, includedInSubscription: true, status: 'published', createdBy: 'u-aman',
    },
    {
      id: 'e-mafia', promotedUntil: inHours(48), location: { lat: 51.1652, lng: 71.4256 }, coverUrl: pexels(8111358), cityId: 'astana', interestId: 'mafia', host: { type: 'organization', id: 'o-mafia' },
      title: 'Городская мафия: вечер для новичков',
      description: 'Ведущий объяснит правила, сыграем 3–4 партии. Чай и печенье включены.',
      venue: 'Mafia Club Astana', address: 'Астана, пр. Республики, 24', startsAt: at(3, 19, 30), durationMin: 180,
      priceKzt: 3500, capacity: 20, seedBooked: 14, includedInSubscription: true, status: 'published', createdBy: 'u-erlan',
    },
    {
      id: 'e-board', location: { lat: 51.0985, lng: 71.4202 }, coverUrl: pexels(8111367), cityId: 'astana', interestId: 'boardgames', host: { type: 'community', id: 'c-boardgames' },
      title: 'Пятничные настолки', description: 'Каркассон, Codenames, Root. Объясняем правила новичкам.',
      venue: 'Антикафе «Ход»', address: 'Астана, ул. Сыганак, 10', startsAt: at(4, 19), durationMin: 180,
      priceKzt: 0, capacity: 16, seedBooked: 6, includedInSubscription: false, status: 'published', createdBy: 'u-erlan',
    },
    {
      id: 'e-run', location: { lat: 51.1524, lng: 71.4472 }, coverUrl: pexels(2526885), cityId: 'astana', interestId: 'running', host: { type: 'community', id: 'c-run' },
      title: 'Утренняя пробежка 7 км', description: 'Сбор у моста «Атырау», темп 6:00/км.',
      venue: 'Набережная Есиля', address: 'Сбор у моста «Атырау»', startsAt: at(1, 7), durationMin: 60,
      priceKzt: 0, capacity: 40, seedBooked: 17, includedInSubscription: false, status: 'published', createdBy: 'u-dana',
    },
    {
      id: 'e-padel', location: { lat: 43.2081, lng: 76.8941 }, coverUrl: pexels(33641987), cityId: 'almaty', interestId: 'tennis', host: { type: 'organization', id: 'o-padel' },
      title: 'Падел для новичков', description: 'Ракетки выдаём. Тренер покажет базу, потом играем пары.',
      venue: 'Padel Club Almaty', address: 'Алматы, ул. Розыбакиева, 247', startsAt: at(0, 20), durationMin: 90,
      priceKzt: 6000, capacity: 8, seedBooked: 5, includedInSubscription: true, status: 'published', createdBy: 'u-aliya',
    },
    {
      id: 'e-it', location: { lat: 43.2183, lng: 76.9275 }, coverUrl: pexels(3194521), cityId: 'almaty', interestId: 'tech', host: { type: 'community', id: 'c-it' },
      title: 'IT-завтрак: AI в продакшене', description: 'Два доклада по 15 минут и свободный нетворкинг.',
      venue: 'Smart Point', address: 'Алматы, пр. Аль-Фараби, 77/8', startsAt: at(2, 9), durationMin: 120,
      priceKzt: 0, capacity: 50, seedBooked: 31, includedInSubscription: false, status: 'published', createdBy: 'u-aliya',
    },
  ];

  // Уже идущая встреча (на ней можно проверить отзыв после посещения) и прошедшая — для отзывов.
  events.push(
    {
      id: 'e-openrun', location: { lat: 51.1251, lng: 71.4651 }, coverUrl: pexels(2526885), cityId: 'astana', interestId: 'running',
      host: { type: 'community', id: 'c-run' }, title: 'Открытая пробежка в Центральном парке',
      description: 'Лёгкие 5 км вокруг озера, темп свободный. Можно присоединиться в процессе.',
      venue: 'Центральный парк', address: 'Астана, ул. Тауелсиздик', startsAt: ago(0.5), durationMin: 90,
      priceKzt: 0, capacity: 50, seedBooked: 14, includedInSubscription: false, status: 'published', createdBy: 'u-dana',
    },
    {
      id: 'e-pizza-past', location: { lat: 51.1283, lng: 71.4305 }, coverUrl: pexels(1028434), cityId: 'astana', interestId: 'cooking',
      host: { type: 'organization', id: 'o-pizza' }, title: 'Мастер-класс: пицца маргарита',
      description: 'Прошедший мастер-класс.', venue: 'Pizza Point', address: 'Астана, ул. Достык, 5', startsAt: ago(72), durationMin: 120,
      priceKzt: 7000, capacity: 12, seedBooked: 12, includedInSubscription: false, status: 'published', createdBy: 'u-dana',
    },
  );

  // Записи других участников: нужны для «идут друзья», участников и статистики организатора.
  const booking = (id: string, eventId: string, userId: string, viaSubscription = false): Booking => ({
    id, eventId, userId, status: 'confirmed', viaSubscription, seats: 1, code: ticketCode(), createdAt: ago(10),
  });
  const bookings: Booking[] = [
    booking('b-s1', 'e-volley', 'u-dana'),
    booking('b-s2', 'e-volley', 'u-erlan'),
    booking('b-s3', 'e-football', 'u-aman', true),
    booking('b-s4', 'e-board', 'u-aman'),
    booking('b-s5', 'e-mafia', 'u-erlan'),
    booking('b-s6', 'e-pizza', 'u-aman'),
    booking('b-s7', 'e-openrun', 'u-aman'),
  ];

  const review = (id: string, eventId: string, eventTitle: string, host: Review['host'], userId: string, rating: number, text: string, hoursAgo: number): Review => ({
    id, eventId, eventTitle, host, userId, userName: users.find((u) => u.id === userId)!.name, rating, text, createdAt: ago(hoursAgo),
  });
  const reviews: Review[] = [
    review('r1', 'e-pizza-past', 'Мастер-класс: пицца маргарита', { type: 'organization', id: 'o-pizza' }, 'u-aman', 5, 'Шеф всё объяснил, пицца получилась как в Неаполе. Приду ещё.', 60),
    review('r2', 'e-pizza-past', 'Мастер-класс: пицца маргарита', { type: 'organization', id: 'o-pizza' }, 'u-erlan', 5, 'Отличная атмосфера, много практики.', 58),
    review('r3', 'e-pizza-past', 'Мастер-класс: пицца маргарита', { type: 'organization', id: 'o-pizza' }, 'u-aliya', 4, 'Вкусно, но было тесновато.', 55),
    review('r4', 'e-football', 'Футбол 6×6', { type: 'organization', id: 'o-arena' }, 'u-erlan', 5, 'Поле отличное, всё организовано.', 200),
    review('r5', 'e-mafia', 'Городская мафия', { type: 'organization', id: 'o-mafia' }, 'u-dana', 5, 'Ведущий — огонь! Новичкам очень комфортно.', 150),
    review('r6', 'e-volley', 'Волейбол: вечерняя игра', { type: 'community', id: 'c-volley' }, 'u-erlan', 5, 'Лучшая компания по волейболу в городе.', 100),
    review('r7', 'e-board', 'Пятничные настолки', { type: 'community', id: 'c-boardgames' }, 'u-aman', 4, 'Много игр, дружелюбные люди.', 90),
  ];

  const posts: Post[] = [
    { id: 'p1', communityId: 'c-volley', authorId: 'u-aman', authorName: 'Аман Б.', createdAt: ago(5),
      text: 'Сегодня играем в 19:00, есть ещё 4 места. Кто новенький — приходите к 18:45, разомнёмся вместе.' },
    { id: 'p2', communityId: 'c-volley', authorId: 'u-aman', authorName: 'Аман Б.', createdAt: ago(48),
      text: 'Спасибо всем за субботу! Фото выложили в чат.' },
    { id: 'p3', communityId: 'c-boardgames', authorId: 'u-erlan', authorName: 'Ерлан М.', createdAt: ago(20),
      text: 'В пятницу привезу «Root» — кто хочет разобраться в правилах, приходите пораньше.' },
    { id: 'p4', communityId: 'c-run', authorId: 'u-dana', authorName: 'Дана К.', createdAt: ago(12),
      text: 'Завтра бежим 7 км, погода +8, берите ветровки.' },
    { id: 'p5', communityId: 'c-it', authorId: 'u-aliya', authorName: 'Алия Л.', createdAt: ago(30),
      text: 'Ищем спикеров на следующий завтрак: тема — мобильная разработка. Пишите в комментариях в чате.' },
  ];

  // Переписка в чатах: имена авторов денормализованы, как и в ответе API.
  const msg = (id: string, communityId: string, authorId: string, hoursAgo: number, text: string, attachments: ChatMessage['attachments'] = []): ChatMessage => ({
    id,
    communityId,
    authorId,
    authorName: users.find((u) => u.id === authorId)!.name,
    text,
    attachments,
    createdAt: ago(hoursAgo),
  });
  const messages: ChatMessage[] = [
    msg('m1', 'c-volley', 'u-aman', 26, 'Всем привет! Вчера было огонь, спасибо, что пришли.'),
    msg('m2', 'c-volley', 'u-dana', 25.8, 'Фото с игры', [{ kind: 'image', url: pexels(6203541, 900), width: 900, height: 600 }]),
    msg('m3', 'c-volley', 'u-erlan', 25.5, 'Класс! В следующий раз возьму второй мяч, этот уже лысый'),
    msg('m4', 'c-volley', 'u-aman', 3, 'Сегодня в 19:00 Дворец спорта. Кто будет — отпишитесь, чтобы я понимал, сколько команд.'),
    msg('m5', 'c-volley', 'u-dana', 2.6, 'Буду +1, возьму подругу'),
    msg('m6', 'c-volley', 'u-erlan', 2.2, 'Я тоже, только опоздаю минут на 10'),
    msg('m7', 'c-boardgames', 'u-erlan', 30, 'В пятницу играем в Root. Правила скину сюда, прочитайте заранее, там много нюансов.'),
    msg('m8', 'c-boardgames', 'u-aman', 28, 'А Каркассон будет? Хочу показать его друзьям'),
    msg('m9', 'c-boardgames', 'u-erlan', 27.5, 'Будет, возьму базу и дополнение с рекой'),
    msg('m10', 'c-run', 'u-dana', 14, 'Завтра 7 км, сбор у моста «Атырау» в 6:50. Погода +8, берите ветровки.'),
    msg('m11', 'c-run', 'u-aman', 13, 'Я в деле. Темп 6:00 держим?'),
    msg('m12', 'c-run', 'u-dana', 12.5, 'Да, первые два км разминочно'),
    msg('m13', 'c-it', 'u-aliya', 20, 'Ищем спикеров на следующий завтрак. Тема — мобильная разработка, 15 минут.'),
  ];

  return {
    version: 1, users, organizations, communities, members, events, bookings, posts, messages,
    payments: [], subscriptions: [], reports: [], waitlist: [], reviews, friendships: [], notifications: [], pushTokens: [], notified: [],
    conversations: [], directMessages: [], blocks: [],
  };
}
