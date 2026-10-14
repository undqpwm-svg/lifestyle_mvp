import AsyncStorage from '@react-native-async-storage/async-storage';

// В браузере SecureStore недоступен. Веб-сборка — только для превью,
// в продакшене для веба нужен httpOnly-cookie на стороне сервера.
const KEY = 'lifestyle.session';

export const sessionStorage = {
  get: () => AsyncStorage.getItem(KEY),
  set: (token: string) => AsyncStorage.setItem(KEY, token),
  clear: () => AsyncStorage.removeItem(KEY),
};
