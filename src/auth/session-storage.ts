import * as SecureStore from 'expo-secure-store';

// Токен сессии на устройстве: Keychain (iOS) / Keystore (Android).
const KEY = 'lifestyle.session';

export const sessionStorage = {
  get: () => SecureStore.getItemAsync(KEY),
  set: (token: string) => SecureStore.setItemAsync(KEY, token),
  clear: () => SecureStore.deleteItemAsync(KEY),
};
