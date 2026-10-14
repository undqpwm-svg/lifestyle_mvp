// Контракт данных мобильного клиента. Должен совпадать с API бэкенда бота.
import type { CityId } from '@/config/cities';
import type { Lang } from '@/i18n';

export type Localized = Record<Lang, string>;

export type CategoryId = 'volleyball' | 'football' | 'boardgames' | 'workshops' | 'walks' | 'tennis';

export type Category = {
  id: CategoryId;
  emoji: string;
  name: Localized;
};

export type EventItem = {
  id: string;
  cityId: CityId;
  categoryId: CategoryId;
  title: Localized;
  venue: string;
  address: string;
  /** ISO 8601 с часовым поясом, например 2026-10-14T19:00:00+05:00 */
  startsAt: string;
  durationMin: number;
  /** Цена в тенге, целое число. 0 — бесплатно. */
  priceKzt: number;
  capacity: number;
  booked: number;
  organizer: { name: string; rating: number };
  description: Localized;
};
