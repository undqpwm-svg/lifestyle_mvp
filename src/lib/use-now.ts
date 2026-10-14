import { useEffect, useState } from 'react';

/** Текущее время, обновляется раз в intervalMs: рендер остаётся чистым, а статусы «прошла/скоро» — актуальными. */
export function useNow(intervalMs = 60_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
