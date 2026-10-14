import { useCallback, useEffect, useRef, useState } from 'react';

// Минимальный хук загрузки данных. Когда появятся кэш, пагинация и мутации,
// заменить на @tanstack/react-query без изменения экранов (тот же контракт data/error/loading/reload).

type State<T> = { data: T | undefined; error: Error | null; loading: boolean };

export function useQuery<T>(fetcher: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<State<T>>({ data: undefined, error: null, loading: true });
  const reqId = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fetcher, deps);

  const load = useCallback(() => {
    const id = ++reqId.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    run()
      .then((data) => {
        // Игнорируем ответ устаревшего запроса (например, после быстрой смены города).
        if (id === reqId.current) setState({ data, error: null, loading: false });
      })
      .catch((error: Error) => {
        if (id === reqId.current) setState((s) => ({ ...s, error, loading: false }));
      });
  }, [run]);

  useEffect(load, [load]);

  return { ...state, reload: load };
}
