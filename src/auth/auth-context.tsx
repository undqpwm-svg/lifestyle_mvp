import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { api, ApiError, setAuthToken } from '@/api/client';
import { isProfileComplete, type ProfileInput, type User } from '@/api/types';

import { sessionStorage } from './session-storage';

type AuthState = {
  /** false — ещё читаем токен с устройства */
  ready: boolean;
  user: User | null;
  /** Есть сессия, но профиль не заполнен — показываем онбординг */
  needsOnboarding: boolean;
  requestCode: (phone: string) => Promise<void>;
  verifyCode: (phone: string, code: string) => Promise<void>;
  completeProfile: (input: ProfileInput) => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const signOut = useCallback(async () => {
    setAuthToken(null);
    setUser(null);
    qc.clear(); // данные прошлого пользователя не должны остаться в кэше
    await sessionStorage.clear().catch(() => {});
  }, [qc]);

  // Восстановление сессии при запуске.
  useEffect(() => {
    (async () => {
      try {
        const token = await sessionStorage.get();
        if (token) {
          setAuthToken(token);
          setUser(await api.me());
        }
      } catch (e) {
        // Токен протух/отозван — разлогиниваем. Сетевую ошибку не считаем выходом,
        // но без профиля работать не можем, поэтому тоже уходим на экран входа.
        if (!(e instanceof ApiError) || e.code !== 'network') await sessionStorage.clear().catch(() => {});
        setAuthToken(null);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      ready,
      user,
      needsOnboarding: !!user && !isProfileComplete(user),
      requestCode: (phone) => api.requestCode(phone),
      verifyCode: async (phone, code) => {
        const res = await api.verifyCode(phone, code);
        setAuthToken(res.token);
        await sessionStorage.set(res.token);
        setUser(res.user);
      },
      completeProfile: async (input) => setUser(await api.updateProfile(input)),
      signOut,
    }),
    [ready, user, signOut],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth вызван вне AuthProvider');
  return ctx;
}

/** Текущий пользователь на экранах за авторизацией (там он гарантированно есть). */
export function useMe(): User {
  const { user } = useAuth();
  if (!user) throw new Error('useMe вызван без сессии');
  return user;
}
