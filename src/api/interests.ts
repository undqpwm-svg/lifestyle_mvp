import type { Lang } from '@/i18n';

import type { InterestId, OrgType } from './types';

// Справочник интересов. Он же — категории встреч и тематика сообществ.
export const INTERESTS: { id: InterestId; emoji: string; name: Record<Lang, string> }[] = [
  { id: 'volleyball', emoji: '🏐', name: { ru: 'Волейбол', kz: 'Волейбол', en: 'Volleyball' } },
  { id: 'football', emoji: '⚽', name: { ru: 'Футбол', kz: 'Футбол', en: 'Football' } },
  { id: 'basketball', emoji: '🏀', name: { ru: 'Баскетбол', kz: 'Баскетбол', en: 'Basketball' } },
  { id: 'tennis', emoji: '🎾', name: { ru: 'Теннис / Падел', kz: 'Теннис / Падел', en: 'Tennis / Padel' } },
  { id: 'running', emoji: '🏃', name: { ru: 'Бег', kz: 'Жүгіру', en: 'Running' } },
  { id: 'boardgames', emoji: '🎲', name: { ru: 'Настолки', kz: 'Үстел ойындары', en: 'Board games' } },
  { id: 'mafia', emoji: '🎭', name: { ru: 'Мафия', kz: 'Мафия', en: 'Mafia' } },
  { id: 'cooking', emoji: '🍕', name: { ru: 'Кулинария', kz: 'Аспаздық', en: 'Cooking' } },
  { id: 'workshops', emoji: '🎓', name: { ru: 'Мастер-классы', kz: 'Мастер-класстар', en: 'Workshops' } },
  { id: 'walks', emoji: '🚶', name: { ru: 'Прогулки', kz: 'Серуендер', en: 'Walks' } },
  { id: 'music', emoji: '🎸', name: { ru: 'Музыка', kz: 'Музыка', en: 'Music' } },
  { id: 'tech', emoji: '💻', name: { ru: 'IT и нетворкинг', kz: 'IT және нетворкинг', en: 'Tech & networking' } },
];

export const interestById = new Map(INTERESTS.map((i) => [i.id, i]));

export const ORG_TYPES: { id: OrgType; emoji: string; name: Record<Lang, string> }[] = [
  { id: 'cafe', emoji: '☕', name: { ru: 'Кафе / ресторан', kz: 'Кафе / мейрамхана', en: 'Cafe / restaurant' } },
  { id: 'sports', emoji: '🏟', name: { ru: 'Спортивный центр', kz: 'Спорт орталығы', en: 'Sports center' } },
  { id: 'club', emoji: '🃏', name: { ru: 'Клуб (мафия, настолки)', kz: 'Клуб (мафия, үстел ойындары)', en: 'Club (mafia, board games)' } },
  { id: 'studio', emoji: '🎨', name: { ru: 'Студия / школа', kz: 'Студия / мектеп', en: 'Studio / school' } },
  { id: 'other', emoji: '📍', name: { ru: 'Другое', kz: 'Басқа', en: 'Other' } },
];
