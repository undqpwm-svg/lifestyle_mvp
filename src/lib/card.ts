// Проверка и форматирование банковской карты (только для формы в демо-режиме).

export const cardDigits = (v: string) => v.replace(/\D/g, '').slice(0, 19);

/** «4242424242424242» → «4242 4242 4242 4242» */
export const formatCardNumber = (digits: string) => digits.replace(/(\d{4})(?=\d)/g, '$1 ');

/** Контрольная сумма по алгоритму Луна. */
export function luhnValid(digits: string): boolean {
  if (digits.length < 13) return false;
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = +digits[digits.length - 1 - i];
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

export type CardBrand = 'visa' | 'mastercard' | 'unknown';

export function cardBrand(digits: string): CardBrand {
  if (/^4/.test(digits)) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'mastercard';
  return 'unknown';
}

/** «1228» → «12/28» по мере ввода */
export function formatExpiry(input: string): string {
  const d = input.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

/** Месяц и год (полный), если срок корректный и не истёк. */
export function parseExpiry(value: string, now = new Date()): { month: number; year: number } | null {
  const m = /^(\d{2})\/(\d{2})$/.exec(value);
  if (!m) return null;
  const month = +m[1];
  const year = 2000 + +m[2];
  if (month < 1 || month > 12) return null;
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);
  return endOfMonth >= now ? { month, year } : null;
}
