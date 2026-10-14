import type { Lang } from '@/i18n';

import type { InterestId, OrgType } from './types';

// Справочник интересов. Он же — категории встреч и тематика сообществ. Иконки — components/icons.ts.
export const INTERESTS: { id: InterestId; name: Record<Lang, string> }[] = [
  { id: 'volleyball', name: { ru: 'Волейбол', kz: 'Волейбол', en: 'Volleyball' } },
  { id: 'football', name: { ru: 'Футбол', kz: 'Футбол', en: 'Football' } },
  { id: 'basketball', name: { ru: 'Баскетбол', kz: 'Баскетбол', en: 'Basketball' } },
  { id: 'tennis', name: { ru: 'Теннис / Падел', kz: 'Теннис / Падел', en: 'Tennis / Padel' } },
  { id: 'running', name: { ru: 'Бег', kz: 'Жүгіру', en: 'Running' } },
  { id: 'boardgames', name: { ru: 'Настолки', kz: 'Үстел ойындары', en: 'Board games' } },
  { id: 'mafia', name: { ru: 'Мафия', kz: 'Мафия', en: 'Mafia' } },
  { id: 'cooking', name: { ru: 'Кулинария', kz: 'Аспаздық', en: 'Cooking' } },
  { id: 'workshops', name: { ru: 'Мастер-классы', kz: 'Мастер-класстар', en: 'Workshops' } },
  { id: 'walks', name: { ru: 'Прогулки', kz: 'Серуендер', en: 'Walks' } },
  { id: 'music', name: { ru: 'Музыка', kz: 'Музыка', en: 'Music' } },
  { id: 'tech', name: { ru: 'IT и нетворкинг', kz: 'IT және нетворкинг', en: 'Tech & networking' } },
];

export const interestById = new Map(INTERESTS.map((i) => [i.id, i]));

export const ORG_TYPES: { id: OrgType; name: Record<Lang, string> }[] = [
  { id: 'cafe', name: { ru: 'Кафе / ресторан', kz: 'Кафе / мейрамхана', en: 'Cafe / restaurant' } },
  { id: 'sports', name: { ru: 'Спортивный центр', kz: 'Спорт орталығы', en: 'Sports center' } },
  { id: 'club', name: { ru: 'Клуб (мафия, настолки)', kz: 'Клуб (мафия, үстел ойындары)', en: 'Club (mafia, board games)' } },
  { id: 'studio', name: { ru: 'Студия / школа', kz: 'Студия / мектеп', en: 'Studio / school' } },
  { id: 'other', name: { ru: 'Другое', kz: 'Басқа', en: 'Other' } },
];
