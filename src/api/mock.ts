import type { Category, EventItem } from './types';

// Тестовые данные до подключения бэкенда. Даты считаются от текущего момента,
// чтобы в ленте всегда были «Сегодня» и «Завтра».

export const CATEGORIES: Category[] = [
  { id: 'volleyball', emoji: '🏐', name: { ru: 'Волейбол', kz: 'Волейбол', en: 'Volleyball' } },
  { id: 'football', emoji: '⚽', name: { ru: 'Футбол', kz: 'Футбол', en: 'Football' } },
  { id: 'boardgames', emoji: '🎲', name: { ru: 'Настолки', kz: 'Үстел ойындары', en: 'Board games' } },
  { id: 'workshops', emoji: '🎓', name: { ru: 'Мастер-классы', kz: 'Мастер-класстар', en: 'Workshops' } },
  { id: 'walks', emoji: '🚶', name: { ru: 'Прогулки', kz: 'Серуендер', en: 'Walks' } },
  { id: 'tennis', emoji: '🎾', name: { ru: 'Теннис / Падел', kz: 'Теннис / Падел', en: 'Tennis / Padel' } },
];

function at(dayOffset: number, hour: number, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

const desc = (ru: string, kz: string, en: string) => ({ ru, kz, en });

export const EVENTS: EventItem[] = [
  {
    id: 'ast-vb-001',
    cityId: 'astana',
    categoryId: 'volleyball',
    title: { ru: 'Волейбол: вечерняя игра', kz: 'Волейбол: кешкі ойын', en: 'Volleyball: evening game' },
    venue: 'Дворец спорта',
    address: 'Астана, пр. Кабанбай батыра, 45',
    startsAt: at(0, 19),
    durationMin: 120,
    priceKzt: 2500,
    capacity: 12,
    booked: 8,
    organizer: { name: 'Аман Б.', rating: 4.9 },
    description: desc(
      'Смешанные команды, уровень — любитель. Мячи и зал включены, нужна только спортивная форма.',
      'Аралас командалар, деңгей — әуесқой. Доп пен зал кіреді, тек спорт киімі керек.',
      'Mixed teams, amateur level. Balls and court included — just bring sportswear.',
    ),
  },
  {
    id: 'ast-fb-002',
    cityId: 'astana',
    categoryId: 'football',
    title: { ru: 'Футбол 6×6', kz: 'Футбол 6×6', en: 'Football 6×6' },
    venue: 'Qazaq Arena',
    address: 'Астана, ул. Туран, 57',
    startsAt: at(1, 18, 30),
    durationMin: 90,
    priceKzt: 2500,
    capacity: 12,
    booked: 10,
    organizer: { name: 'Дана К.', rating: 5.0 },
    description: desc(
      'Крытое поле, манишки выдаём. Играем три тайма по 30 минут.',
      'Жабық алаң, манишкалар беріледі. 30 минуттан үш тайм ойнаймыз.',
      'Indoor pitch, bibs provided. Three 30-minute halves.',
    ),
  },
  {
    id: 'ast-bg-003',
    cityId: 'astana',
    categoryId: 'boardgames',
    title: { ru: 'Вечер настолок', kz: 'Үстел ойындары кеші', en: 'Board games night' },
    venue: 'Антикафе «Ход»',
    address: 'Астана, ул. Сыганак, 10',
    startsAt: at(2, 19, 30),
    durationMin: 180,
    priceKzt: 3000,
    capacity: 16,
    booked: 6,
    organizer: { name: 'Ерлан М.', rating: 4.8 },
    description: desc(
      'Мафия, Codenames, Каркассон. Ведущий объяснит правила новичкам. Чай включён.',
      'Мафия, Codenames, Каркассон. Жүргізуші жаңадан келгендерге ережені түсіндіреді. Шай кіреді.',
      'Mafia, Codenames, Carcassonne. The host explains rules to newcomers. Tea included.',
    ),
  },
  {
    id: 'ast-ws-004',
    cityId: 'astana',
    categoryId: 'workshops',
    title: { ru: 'Публичные выступления', kz: 'Көпшілік алдында сөйлеу', en: 'Public speaking' },
    venue: 'Коворкинг Astana Hub',
    address: 'Астана, пр. Мангилик Ел, 55/8',
    startsAt: at(3, 11),
    durationMin: 150,
    priceKzt: 5000,
    capacity: 20,
    booked: 19,
    organizer: { name: 'Айгерим С.', rating: 4.9 },
    description: desc(
      'Практический тренинг: структура речи, работа с волнением, разбор выступлений участников.',
      'Практикалық тренинг: сөз құрылымы, толқумен жұмыс, қатысушылардың сөйлеуін талдау.',
      'Hands-on training: speech structure, handling nerves, feedback on your talks.',
    ),
  },
  {
    id: 'ast-wk-005',
    cityId: 'astana',
    categoryId: 'walks',
    title: { ru: 'Прогулка по набережной', kz: 'Жағалаумен серуен', en: 'Embankment walk' },
    venue: 'Набережная Есиля',
    address: 'Сбор у моста «Атырау»',
    startsAt: at(4, 17),
    durationMin: 90,
    priceKzt: 0,
    capacity: 30,
    booked: 12,
    organizer: { name: 'LIFESTYLE', rating: 5.0 },
    description: desc(
      'Лёгкая прогулка и знакомство. Бесплатно, нужна только запись.',
      'Жеңіл серуен және танысу. Тегін, тек жазылу керек.',
      'An easy walk to meet people. Free, booking required.',
    ),
  },
  {
    id: 'ala-tn-006',
    cityId: 'almaty',
    categoryId: 'tennis',
    title: { ru: 'Падел для новичков', kz: 'Жаңадан бастаушыларға падел', en: 'Padel for beginners' },
    venue: 'Padel Club Almaty',
    address: 'Алматы, ул. Розыбакиева, 247',
    startsAt: at(0, 20),
    durationMin: 90,
    priceKzt: 6000,
    capacity: 8,
    booked: 5,
    organizer: { name: 'Тимур П.', rating: 4.7 },
    description: desc(
      'Ракетки выдаём. Тренер покажет базовые удары, потом играем пары.',
      'Ракеткалар беріледі. Жаттықтырушы негізгі соққыларды көрсетеді, кейін жұптасып ойнаймыз.',
      'Rackets provided. A coach shows the basics, then we play doubles.',
    ),
  },
  {
    id: 'ala-vb-007',
    cityId: 'almaty',
    categoryId: 'volleyball',
    title: { ru: 'Волейбол в Алматы', kz: 'Алматыдағы волейбол', en: 'Volleyball in Almaty' },
    venue: 'СК «Алатау»',
    address: 'Алматы, пр. Абая, 48',
    startsAt: at(1, 19),
    durationMin: 120,
    priceKzt: 2500,
    capacity: 14,
    booked: 7,
    organizer: { name: 'Алия Л.', rating: 4.9 },
    description: desc(
      'Любительская игра, делимся на команды на месте.',
      'Әуесқой ойын, командаларға орнында бөлінеміз.',
      'Amateur game, teams are split on site.',
    ),
  },
];
