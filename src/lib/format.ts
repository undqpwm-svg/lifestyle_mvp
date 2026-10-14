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
