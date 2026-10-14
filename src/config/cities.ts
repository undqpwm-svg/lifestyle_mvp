import type { Lang } from '@/i18n';

export type CityId = 'astana' | 'almaty';

export type City = {
  id: CityId;
  name: Record<Lang, string>;
};

export const CITIES: City[] = [
  {
    id: 'astana',
    name: { ru: 'Астана', kz: 'Астана', en: 'Astana' },
  },
  {
    id: 'almaty',
    name: { ru: 'Алматы', kz: 'Алматы', en: 'Almaty' },
  },
];

export const DEFAULT_CITY: CityId = 'astana';

export function getCity(id: CityId): City {
  return CITIES.find((c) => c.id === id) ?? CITIES[0];
}
