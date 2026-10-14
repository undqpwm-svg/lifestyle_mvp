import type { Api } from './api';
import { createHttpApi } from './http-api';
import { mockApi } from './mock-api';

// EXPO_PUBLIC_API_URL задан — работаем с бэкендом, иначе — с тестовым сервером на устройстве.
const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');

export const api: Api = API_URL ? createHttpApi(API_URL) : mockApi;
export const isMockApi = !API_URL;

export { ApiError, setAuthToken } from './api';
