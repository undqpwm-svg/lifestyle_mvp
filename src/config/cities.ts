import type { Lang } from '@/i18n';

export type CityId = 'astana' | 'almaty';

export type City = {
  id: CityId;
  name: Record<Lang, string>;
  // Канал сообщества города в Telegram (как на сайте).
  community: string;
};

export const CITIES: City[] = [
  {
    id: 'astana',
    name: { ru: 'Астана', kz: 'Астана', en: 'Astana' },
    community: 'https://t.me/lifestyle_astana',
  },
  {
    id: 'almaty',
    name: { ru: 'Алматы', kz: 'Алматы', en: 'Almaty' },
    community: 'https://t.me/lifestyle_almaty',
  },
];

export const DEFAULT_CITY: CityId = 'astana';

export function getCity(id: CityId): City {
  return CITIES.find((c) => c.id === id) ?? CITIES[0];
}
