import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { DEFAULT_CITY, type CityId } from '@/config/cities';
import { dictionaries, type Dictionary, type Lang } from '@/i18n';

// Пользовательские настройки, переживающие перезапуск: язык, город, локальные заявки.
// Заявки хранятся локально до появления бэкенда — потом источником станет API.

const STORAGE_KEY = 'lifestyle.settings.v1';

type Persisted = { lang: Lang; cityId: CityId; bookedEventIds: string[] };

const DEFAULTS: Persisted = { lang: 'ru', cityId: DEFAULT_CITY, bookedEventIds: [] };

type AppSettings = Persisted & {
  ready: boolean;
  t: Dictionary;
  setLang: (lang: Lang) => void;
  setCity: (cityId: CityId) => void;
  addBooking: (eventId: string) => void;
};

const Ctx = createContext<AppSettings | null>(null);

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(DEFAULTS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setState({ ...DEFAULTS, ...(JSON.parse(raw) as Partial<Persisted>) });
      })
      .catch(() => {
        // Битые или недоступные данные — работаем на значениях по умолчанию.
      })
      .finally(() => setReady(true));
  }, []);

  const update = useCallback((patch: (prev: Persisted) => Persisted) => {
    setState((prev) => {
      const next = patch(prev);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo<AppSettings>(
    () => ({
      ...state,
      ready,
      t: dictionaries[state.lang],
      setLang: (lang) => update((p) => ({ ...p, lang })),
      setCity: (cityId) => update((p) => ({ ...p, cityId })),
      addBooking: (id) =>
        update((p) =>
          p.bookedEventIds.includes(id) ? p : { ...p, bookedEventIds: [...p.bookedEventIds, id] },
        ),
    }),
    [state, ready, update],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppSettings(): AppSettings {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAppSettings вызван вне AppSettingsProvider');
  return ctx;
}
