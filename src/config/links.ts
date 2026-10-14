// Внешние ссылки и deep-link'и в Telegram-бота.
export const BOT_USERNAME = 'LIFESTYLEK_BOT';
export const ORGANIZER_CONTACT = 'https://t.me/Zhenis_lifestyle';

export const LEGAL_LINKS = {
  offer: 'https://lifestyle.ink/public-offer/',
  privacy: 'https://lifestyle.ink/privacy/',
  terms: 'https://lifestyle.ink/terms/',
} as const;

/**
 * Ссылка на бота с payload для /start.
 * Telegram допускает в start-параметре только [A-Za-z0-9_-] и до 64 символов,
 * поэтому всё остальное вырезаем.
 */
export function botStartLink(payload: string): string {
  const safe = payload.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 64);
  return `https://t.me/${BOT_USERNAME}?start=${safe}`;
}
