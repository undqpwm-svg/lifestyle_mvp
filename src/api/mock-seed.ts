import type { CityId } from '@/config/cities';

import { pexels } from '@/lib/media';

import type { Booking, ChatMessage, CommunityRole, InterestId, Organization, Payment, Post, Subscription, User } from './types';

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

export type Db = {
  version: 1;
  users: User[];
  organizations: Organization[];
  communities: DbCommunity[];
  members: DbMember[];
  events: DbEvent[];
  bookings: Booking[];
  posts: Post[];
  messages: ChatMessage[];
  payments: (Payment & { userId: string })[];
  subscriptions: (Subscription & { userId: string })[];
  reports: { target: string; targetId: string; reason: string; userId: string; createdAt: string }[];
};

function at(dayOffset: number, hour: number, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

const ago = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString();

export function createSeed(): Db {
  const users: User[] = [
    { id: 'u-aman', phone: '+77010000001', name: 'Аман Б.', cityId: 'astana', interests: ['volleyball'], createdAt: ago(900) },
    { id: 'u-dana', phone: '+77010000002', name: 'Дана К.', cityId: 'astana', interests: ['running', 'walks'], createdAt: ago(800) },
    { id: 'u-erlan', phone: '+77010000003', name: 'Ерлан М.', cityId: 'astana', interests: ['boardgames', 'mafia'], createdAt: ago(700) },
    { id: 'u-aliya', phone: '+77010000004', name: 'Алия Л.', cityId: 'almaty', interests: ['tech'], createdAt: ago(600) },
  ];

  const organizations: Organization[] = [
    {
      id: 'o-pizza', coverUrl: pexels(1028434), name: 'Pizza Point', type: 'cafe', cityId: 'astana', address: 'Астана, ул. Достык, 5',
      description: 'Неаполитанская пицца на дровах. Проводим мастер-классы для взрослых и детей.',
      bin: '220740027686', status: 'verified', ownerId: 'u-dana', createdAt: ago(500),
    },
    {
      id: 'o-arena', coverUrl: pexels(2874717), name: 'Qazaq Arena', type: 'sports', cityId: 'astana', address: 'Астана, ул. Туран, 57',
      description: 'Крытые поля для футбола и баскетбола, аренда и любительские игры.',
      bin: '190340011223', status: 'verified', ownerId: 'u-aman', createdAt: ago(480),
    },
    {
      id: 'o-mafia', coverUrl: pexels(8111364), name: 'Mafia Club Astana', type: 'club', cityId: 'astana', address: 'Астана, пр. Республики, 24',
      description: 'Спортивная и городская мафия с профессиональными ведущими.',
      bin: '210540098765', status: 'verified', ownerId: 'u-erlan', createdAt: ago(470),
    },
    {
      id: 'o-padel', coverUrl: pexels(32474981), name: 'Padel Club Almaty', type: 'sports', cityId: 'almaty', address: 'Алматы, ул. Розыбакиева, 247',
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
      id: 'e-pizza', coverUrl: pexels(4071399), cityId: 'astana', interestId: 'cooking', host: { type: 'organization', id: 'o-pizza' },
      title: 'Мастер-класс: неаполитанская пицца',
      description: 'Шеф покажет, как замесить тесто и выпечь пиццу в дровяной печи. Готовите сами, свою пиццу забираете с собой.',
      venue: 'Pizza Point', address: 'Астана, ул. Достык, 5', startsAt: at(2, 18), durationMin: 120,
      priceKzt: 8000, capacity: 12, seedBooked: 9, includedInSubscription: false, status: 'published', createdBy: 'u-dana',
    },
    {
      id: 'e-volley', coverUrl: pexels(6203560), cityId: 'astana', interestId: 'volleyball', host: { type: 'community', id: 'c-volley' },
      title: 'Волейбол: вечерняя игра',
      description: 'Смешанные команды, уровень — любитель. Мячи есть, нужна только форма.',
      venue: 'Дворец спорта', address: 'Астана, пр. Кабанбай батыра, 45', startsAt: at(0, 19), durationMin: 120,
      priceKzt: 0, capacity: 12, seedBooked: 8, includedInSubscription: false, status: 'published', createdBy: 'u-aman',
    },
    {
      id: 'e-football', coverUrl: pexels(3316945), cityId: 'astana', interestId: 'football', host: { type: 'organization', id: 'o-arena' },
      title: 'Футбол 6×6', description: 'Крытое поле, манишки выдаём. Три тайма по 30 минут.',
      venue: 'Qazaq Arena', address: 'Астана, ул. Туран, 57', startsAt: at(1, 18, 30), durationMin: 90,
      priceKzt: 2500, capacity: 12, seedBooked: 10, includedInSubscription: true, status: 'published', createdBy: 'u-aman',
    },
    {
      id: 'e-mafia', coverUrl: pexels(8111358), cityId: 'astana', interestId: 'mafia', host: { type: 'organization', id: 'o-mafia' },
      title: 'Городская мафия: вечер для новичков',
      description: 'Ведущий объяснит правила, сыграем 3–4 партии. Чай и печенье включены.',
      venue: 'Mafia Club Astana', address: 'Астана, пр. Республики, 24', startsAt: at(3, 19, 30), durationMin: 180,
      priceKzt: 3500, capacity: 20, seedBooked: 14, includedInSubscription: true, status: 'published', createdBy: 'u-erlan',
    },
    {
      id: 'e-board', coverUrl: pexels(8111367), cityId: 'astana', interestId: 'boardgames', host: { type: 'community', id: 'c-boardgames' },
      title: 'Пятничные настолки', description: 'Каркассон, Codenames, Root. Объясняем правила новичкам.',
      venue: 'Антикафе «Ход»', address: 'Астана, ул. Сыганак, 10', startsAt: at(4, 19), durationMin: 180,
      priceKzt: 0, capacity: 16, seedBooked: 6, includedInSubscription: false, status: 'published', createdBy: 'u-erlan',
    },
    {
      id: 'e-run', coverUrl: pexels(2526885), cityId: 'astana', interestId: 'running', host: { type: 'community', id: 'c-run' },
      title: 'Утренняя пробежка 7 км', description: 'Сбор у моста «Атырау», темп 6:00/км.',
      venue: 'Набережная Есиля', address: 'Сбор у моста «Атырау»', startsAt: at(1, 7), durationMin: 60,
      priceKzt: 0, capacity: 40, seedBooked: 17, includedInSubscription: false, status: 'published', createdBy: 'u-dana',
    },
    {
      id: 'e-padel', coverUrl: pexels(33641987), cityId: 'almaty', interestId: 'tennis', host: { type: 'organization', id: 'o-padel' },
      title: 'Падел для новичков', description: 'Ракетки выдаём. Тренер покажет базу, потом играем пары.',
      venue: 'Padel Club Almaty', address: 'Алматы, ул. Розыбакиева, 247', startsAt: at(0, 20), durationMin: 90,
      priceKzt: 6000, capacity: 8, seedBooked: 5, includedInSubscription: true, status: 'published', createdBy: 'u-aliya',
    },
    {
      id: 'e-it', coverUrl: pexels(3194521), cityId: 'almaty', interestId: 'tech', host: { type: 'community', id: 'c-it' },
      title: 'IT-завтрак: AI в продакшене', description: 'Два доклада по 15 минут и свободный нетворкинг.',
      venue: 'Smart Point', address: 'Алматы, пр. Аль-Фараби, 77/8', startsAt: at(2, 9), durationMin: 120,
      priceKzt: 0, capacity: 50, seedBooked: 31, includedInSubscription: false, status: 'published', createdBy: 'u-aliya',
    },
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

  return { version: 1, users, organizations, communities, members, events, bookings: [], posts, messages, payments: [], subscriptions: [], reports: [] };
}
