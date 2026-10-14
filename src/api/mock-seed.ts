import type { CityId } from '@/config/cities';

import type { Booking, CommunityRole, InterestId, Organization, Post, User } from './types';

// Начальные данные тестового сервера. Даты считаются от текущего момента.

export type DbEvent = {
  id: string;
  cityId: CityId;
  interestId: InterestId;
  title: string;
  description: string;
  host: { type: 'organization' | 'community'; id: string };
  venue: string;
  address: string;
  startsAt: string;
  durationMin: number;
  priceKzt: number;
  capacity: number;
  /** Участники, записанные «до» тестовых данных (в реальной БД — из bookings) */
  seedBooked: number;
  status: 'published' | 'cancelled';
  createdBy: string;
};

export type DbCommunity = {
  id: string;
  name: string;
  description: string;
  cityId: CityId;
  interests: InterestId[];
  ownerId: string;
  telegramUrl?: string;
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
      id: 'o-pizza', name: 'Pizza Point', type: 'cafe', cityId: 'astana', address: 'Астана, ул. Достык, 5',
      description: 'Неаполитанская пицца на дровах. Проводим мастер-классы для взрослых и детей.',
      bin: '220740027686', status: 'verified', ownerId: 'u-dana', createdAt: ago(500),
    },
    {
      id: 'o-arena', name: 'Qazaq Arena', type: 'sports', cityId: 'astana', address: 'Астана, ул. Туран, 57',
      description: 'Крытые поля для футбола и баскетбола, аренда и любительские игры.',
      bin: '190340011223', status: 'verified', ownerId: 'u-aman', createdAt: ago(480),
    },
    {
      id: 'o-mafia', name: 'Mafia Club Astana', type: 'club', cityId: 'astana', address: 'Астана, пр. Республики, 24',
      description: 'Спортивная и городская мафия с профессиональными ведущими.',
      bin: '210540098765', status: 'verified', ownerId: 'u-erlan', createdAt: ago(470),
    },
    {
      id: 'o-padel', name: 'Padel Club Almaty', type: 'sports', cityId: 'almaty', address: 'Алматы, ул. Розыбакиева, 247',
      description: 'Шесть кортов для падела, тренеры, турниры по выходным.',
      bin: '200840055667', status: 'verified', ownerId: 'u-aliya', createdAt: ago(460),
    },
  ];

  const communities: DbCommunity[] = [
    {
      id: 'c-volley', name: 'Волейбол Астана', cityId: 'astana', interests: ['volleyball'], ownerId: 'u-aman',
      description: 'Играем 3 раза в неделю, уровень от новичка до любителя. Новичкам рады!',
      telegramUrl: 'https://t.me/lifestyle_astana', seedMembers: 214, createdAt: ago(400),
    },
    {
      id: 'c-boardgames', name: 'Настолки по пятницам', cityId: 'astana', interests: ['boardgames', 'mafia'], ownerId: 'u-erlan',
      description: 'Собираемся каждую пятницу: Каркассон, Codenames, Root. Приносите свои игры.',
      seedMembers: 87, createdAt: ago(300),
    },
    {
      id: 'c-run', name: 'Бегуны Есиля', cityId: 'astana', interests: ['running', 'walks'], ownerId: 'u-dana',
      description: 'Утренние пробежки 5–10 км по набережной. Темп комфортный, никого не бросаем.',
      seedMembers: 132, createdAt: ago(200),
    },
    {
      id: 'c-it', name: 'IT-завтраки Алматы', cityId: 'almaty', interests: ['tech'], ownerId: 'u-aliya',
      description: 'Разработчики, продакты и дизайнеры. Кофе, доклады на 15 минут, нетворкинг.',
      seedMembers: 356, createdAt: ago(150),
    },
  ];

  const members: DbMember[] = communities.map((c) => ({ communityId: c.id, userId: c.ownerId, role: 'owner' }));

  const events: DbEvent[] = [
    {
      id: 'e-pizza', cityId: 'astana', interestId: 'cooking', host: { type: 'organization', id: 'o-pizza' },
      title: 'Мастер-класс: неаполитанская пицца',
      description: 'Шеф покажет, как замесить тесто и выпечь пиццу в дровяной печи. Готовите сами, свою пиццу забираете с собой.',
      venue: 'Pizza Point', address: 'Астана, ул. Достык, 5', startsAt: at(2, 18), durationMin: 120,
      priceKzt: 8000, capacity: 12, seedBooked: 9, status: 'published', createdBy: 'u-dana',
    },
    {
      id: 'e-volley', cityId: 'astana', interestId: 'volleyball', host: { type: 'community', id: 'c-volley' },
      title: 'Волейбол: вечерняя игра',
      description: 'Смешанные команды, уровень — любитель. Мячи есть, нужна только форма.',
      venue: 'Дворец спорта', address: 'Астана, пр. Кабанбай батыра, 45', startsAt: at(0, 19), durationMin: 120,
      priceKzt: 0, capacity: 12, seedBooked: 8, status: 'published', createdBy: 'u-aman',
    },
    {
      id: 'e-football', cityId: 'astana', interestId: 'football', host: { type: 'organization', id: 'o-arena' },
      title: 'Футбол 6×6', description: 'Крытое поле, манишки выдаём. Три тайма по 30 минут.',
      venue: 'Qazaq Arena', address: 'Астана, ул. Туран, 57', startsAt: at(1, 18, 30), durationMin: 90,
      priceKzt: 2500, capacity: 12, seedBooked: 10, status: 'published', createdBy: 'u-aman',
    },
    {
      id: 'e-mafia', cityId: 'astana', interestId: 'mafia', host: { type: 'organization', id: 'o-mafia' },
      title: 'Городская мафия: вечер для новичков',
      description: 'Ведущий объяснит правила, сыграем 3–4 партии. Чай и печенье включены.',
      venue: 'Mafia Club Astana', address: 'Астана, пр. Республики, 24', startsAt: at(3, 19, 30), durationMin: 180,
      priceKzt: 3500, capacity: 20, seedBooked: 14, status: 'published', createdBy: 'u-erlan',
    },
    {
      id: 'e-board', cityId: 'astana', interestId: 'boardgames', host: { type: 'community', id: 'c-boardgames' },
      title: 'Пятничные настолки', description: 'Каркассон, Codenames, Root. Объясняем правила новичкам.',
      venue: 'Антикафе «Ход»', address: 'Астана, ул. Сыганак, 10', startsAt: at(4, 19), durationMin: 180,
      priceKzt: 0, capacity: 16, seedBooked: 6, status: 'published', createdBy: 'u-erlan',
    },
    {
      id: 'e-run', cityId: 'astana', interestId: 'running', host: { type: 'community', id: 'c-run' },
      title: 'Утренняя пробежка 7 км', description: 'Сбор у моста «Атырау», темп 6:00/км.',
      venue: 'Набережная Есиля', address: 'Сбор у моста «Атырау»', startsAt: at(1, 7), durationMin: 60,
      priceKzt: 0, capacity: 40, seedBooked: 17, status: 'published', createdBy: 'u-dana',
    },
    {
      id: 'e-padel', cityId: 'almaty', interestId: 'tennis', host: { type: 'organization', id: 'o-padel' },
      title: 'Падел для новичков', description: 'Ракетки выдаём. Тренер покажет базу, потом играем пары.',
      venue: 'Padel Club Almaty', address: 'Алматы, ул. Розыбакиева, 247', startsAt: at(0, 20), durationMin: 90,
      priceKzt: 6000, capacity: 8, seedBooked: 5, status: 'published', createdBy: 'u-aliya',
    },
    {
      id: 'e-it', cityId: 'almaty', interestId: 'tech', host: { type: 'community', id: 'c-it' },
      title: 'IT-завтрак: AI в продакшене', description: 'Два доклада по 15 минут и свободный нетворкинг.',
      venue: 'Smart Point', address: 'Алматы, пр. Аль-Фараби, 77/8', startsAt: at(2, 9), durationMin: 120,
      priceKzt: 0, capacity: 50, seedBooked: 31, status: 'published', createdBy: 'u-aliya',
    },
  ];

  const posts: Post[] = [
    { id: 'p1', communityId: 'c-volley', authorId: 'u-aman', authorName: 'Аман Б.', createdAt: ago(5),
      text: 'Сегодня играем в 19:00, есть ещё 4 места. Кто новенький — приходите к 18:45, разомнёмся вместе 🏐' },
    { id: 'p2', communityId: 'c-volley', authorId: 'u-aman', authorName: 'Аман Б.', createdAt: ago(48),
      text: 'Спасибо всем за субботу! Фото в чате в Telegram.' },
    { id: 'p3', communityId: 'c-boardgames', authorId: 'u-erlan', authorName: 'Ерлан М.', createdAt: ago(20),
      text: 'В пятницу привезу «Root» — кто хочет разобраться в правилах, приходите пораньше.' },
    { id: 'p4', communityId: 'c-run', authorId: 'u-dana', authorName: 'Дана К.', createdAt: ago(12),
      text: 'Завтра бежим 7 км, погода +8, берите ветровки.' },
    { id: 'p5', communityId: 'c-it', authorId: 'u-aliya', authorName: 'Алия Л.', createdAt: ago(30),
      text: 'Ищем спикеров на следующий завтрак: тема — мобильная разработка. Пишите в комментариях в чате.' },
  ];

  return { version: 1, users, organizations, communities, members, events, bookings: [], posts, reports: [] };
}
