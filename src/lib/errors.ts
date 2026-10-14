import { ApiError } from '@/api/client';
import type { Dictionary } from '@/i18n';

/** Человекочитаемый текст ошибки API на текущем языке. */
export function errorMessage(e: unknown, t: Dictionary): string {
  if (e instanceof ApiError) return t.errors[e.code] ?? t.errors.server;
  return t.errors.server;
}
