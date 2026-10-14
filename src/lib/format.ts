import { intlLocale, type Dictionary, type Lang } from '@/i18n';

/** 2500 → «2 500 ₸». Разделитель — неразрывный пробел, как принято в KZ. */
export function formatKzt(amount: number): string {
  return `${Math.round(amount).toLocaleString('ru-RU').replace(/\s/g, ' ')} ₸`;
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** «Сегодня, 19:00» / «Завтра, 18:30» / «пт, 17 окт., 11:00». */
export function formatEventDate(iso: string, lang: Lang, t: Dictionary): string {
  const date = new Date(iso);
  const locale = intlLocale[lang];
  const time = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false });
  const diffDays = Math.round((startOfDay(date) - startOfDay(new Date())) / 86_400_000);
  if (diffDays === 0) return `${t.events.today}, ${time}`;
  if (diffDays === 1) return `${t.events.tomorrow}, ${time}`;
  const day = date.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });
  return `${day}, ${time}`;
}

// Без Intl.RelativeTimeFormat: в Hermes на Android он поддерживается не везде.
const AGO: Record<Lang, { now: string; min: string; h: string; d: string; suffix: string }> = {
  ru: { now: 'только что', min: 'мин', h: 'ч', d: 'дн', suffix: 'назад' },
  kz: { now: 'жаңа ғана', min: 'мин', h: 'сағ', d: 'күн', suffix: 'бұрын' },
  en: { now: 'just now', min: 'min', h: 'h', d: 'd', suffix: 'ago' },
};

/** «5 мин назад» / «3 ч назад» / «2 дн назад» / дата — для ленты сообщества. */
export function formatRelative(iso: string, lang: Lang): string {
  const sec = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  const w = AGO[lang];
  if (sec < 60) return w.now;
  if (sec < 3600) return `${Math.floor(sec / 60)} ${w.min} ${w.suffix}`;
  if (sec < 86_400) return `${Math.floor(sec / 3600)} ${w.h} ${w.suffix}`;
  if (sec < 7 * 86_400) return `${Math.floor(sec / 86_400)} ${w.d} ${w.suffix}`;
  return new Date(iso).toLocaleDateString(intlLocale[lang], { day: 'numeric', month: 'short' });
}
