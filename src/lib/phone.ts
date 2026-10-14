// Телефоны Казахстана: +7 7XX XXX XX XX. Храним в E.164: +77XXXXXXXXX.

/** Оставляет 10 цифр национального номера, отбрасывая +7 / 8 в начале. */
export function phoneDigits(input: string): string {
  let d = input.replace(/\D/g, '');
  if (d.length > 10 && (d.startsWith('7') || d.startsWith('8'))) d = d.slice(1);
  return d.slice(0, 10);
}

/** «7011234567» → «701 123 45 67» (для поля ввода после префикса +7) */
export function formatPhoneInput(digits: string): string {
  const d = digits.slice(0, 10);
  return [d.slice(0, 3), d.slice(3, 6), d.slice(6, 8), d.slice(8, 10)].filter(Boolean).join(' ');
}

/** Мобильные номера РК начинаются на 7 (700–778). */
export const isValidKzMobile = (digits: string) => /^7\d{9}$/.test(digits);

export const toE164 = (digits: string) => `+7${digits}`;

/** +77011234567 → +7 701 ••• •• 67 */
export function maskPhone(e164: string): string {
  const d = e164.replace(/\D/g, '').slice(1);
  return `+7 ${d.slice(0, 3)} ••• •• ${d.slice(8, 10)}`;
}
