import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { DEFAULT_CITY, type CityId } from '@/config/cities';
import { dictionaries, type Dictionary, type Lang } from '@/i18n';

// Настройки устройства, переживающие перезапуск: язык интерфейса и город, который смотрит пользователь.
// Город в профиле — «домашний», здесь — текущий выбор в ленте (можно смотреть другой город).

const STORAGE_KEY = 'lifestyle.settings.v1';

type Persisted = { lang: Lang; cityId: CityId };

const DEFAULTS: Persisted = { lang: 'ru', cityId: DEFAULT_CITY };

type AppSettings = Persisted & {
  ready: boolean;
  t: Dictionary;
  setLang: (lang: Lang) => void;
  setCity: (cityId: CityId) => void;
};

const Ctx = createContext<AppSettings | null>(null);

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(DEFAULTS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const { lang, cityId } = JSON.parse(raw) as Partial<Persisted>;
          setState({ lang: lang ?? DEFAULTS.lang, cityId: cityId ?? DEFAULTS.cityId });
        }
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
