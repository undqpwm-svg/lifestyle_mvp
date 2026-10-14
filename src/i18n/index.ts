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

// Локаль для Intl: казахский в Intl — 'kk'. Если движок его не знает (часть браузеров, Hermes на Android),
// даты показываем в русском формате — он привычен в Казахстане, в отличие от английского.
const kkSupported = (() => {
  try {
    return Intl.DateTimeFormat.supportedLocalesOf(['kk-KZ']).length > 0;
  } catch {
    return false;
  }
})();
export const intlLocale: Record<Lang, string> = { ru: 'ru-RU', kz: kkSupported ? 'kk-KZ' : 'ru-RU', en: 'en-US' };

export type { Dictionary };
