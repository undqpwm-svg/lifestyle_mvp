import type { GeoPoint } from '@/api/types';
import type { Lang } from '@/i18n';

export type CityId = 'astana' | 'almaty';

export type City = {
  id: CityId;
  name: Record<Lang, string>;
  /** Центр карты города */
  center: GeoPoint;
};

export const CITIES: City[] = [
  {
    id: 'astana',
    name: { ru: 'Астана', kz: 'Астана', en: 'Astana' },
    center: { lat: 51.1282, lng: 71.4304 },
  },
  {
    id: 'almaty',
    name: { ru: 'Алматы', kz: 'Алматы', en: 'Almaty' },
    center: { lat: 43.2381, lng: 76.9452 },
  },
];

export const DEFAULT_CITY: CityId = 'astana';

export function getCity(id: CityId): City {
  return CITIES.find((c) => c.id === id) ?? CITIES[0];
}
