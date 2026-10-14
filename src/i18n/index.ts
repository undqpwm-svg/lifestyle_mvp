import { en } from './en';
import { kz } from './kz';
import { ru, type Dictionary } from './ru';

export type Lang = 'ru' | 'kz' | 'en';

export const LANGS: { id: Lang; label: string }[] = [
  { id: 'ru', label: 'RU' },
  { id: 'kz', label: 'KZ' },
  { id: 'en', label: 'EN' },
];

export const dictionaries: Record<Lang, Dictionary> = { ru, kz, en };

// Локаль для Intl: казахский в Intl — 'kk'.
export const intlLocale: Record<Lang, string> = { ru: 'ru-RU', kz: 'kk-KZ', en: 'en-US' };

export type { Dictionary };
