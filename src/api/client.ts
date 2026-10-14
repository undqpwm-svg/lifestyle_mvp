import type { CityId } from '@/config/cities';

import { CATEGORIES, EVENTS } from './mock';
import type { Category, EventItem } from './types';

// Базовый URL бэкенда задаётся в .env: EXPO_PUBLIC_API_URL=https://api.lifestyle.ink
// Пока переменная не задана, клиент отдаёт тестовые данные.
const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
const TIMEOUT_MS = 10_000;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${API_URL}${path}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) throw new ApiError(`HTTP ${res.status} ${path}`, res.status);
    return (await res.json()) as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(controller.signal.aborted ? `Таймаут запроса ${path}` : `Сеть недоступна: ${path}`);
  } finally {
    clearTimeout(timer);
  }
}

// Имитация сетевой задержки, чтобы в UI были видны состояния загрузки.
const mockDelay = <T,>(data: T) => new Promise<T>((r) => setTimeout(() => r(data), 250));

export const api = {
  categories(): Promise<Category[]> {
    return API_URL ? request('/v1/categories') : mockDelay(CATEGORIES);
  },

  events(cityId: CityId): Promise<EventItem[]> {
    if (API_URL) return request(`/v1/events?city=${encodeURIComponent(cityId)}`);
    const list = EVENTS.filter((e) => e.cityId === cityId).sort((a, b) =>
      a.startsAt.localeCompare(b.startsAt),
    );
    return mockDelay(list);
  },

  event(id: string): Promise<EventItem | null> {
    if (API_URL) return request(`/v1/events/${encodeURIComponent(id)}`);
    return mockDelay(EVENTS.find((e) => e.id === id) ?? null);
  },
};
