import { Linking, Platform } from 'react-native';

import type { GeoPoint } from '@/api/types';
import type { CityId } from '@/config/cities';

/**
 * Открытие точки и маршрута в 2GIS без ключа и SDK — через deeplink приложения.
 * Формат из справки 2GIS «Разработчикам: запуск через deeplink»:
 *   dgis://2gis.ru/routeSearch/rsType/<тип>/to/<долгота>,<широта>
 * Точка отправления не передаётся — 2GIS берёт текущее местоположение пользователя.
 * Порядок координат у 2GIS — сначала долгота, потом широта (у нас в GeoPoint наоборот).
 */
export type DgisRouteType = 'pedestrian' | 'car' | 'ctx' | 'taxi';

const coords = (p: GeoPoint) => `${p.lng.toFixed(6)},${p.lat.toFixed(6)}`;

export function dgisRouteUrl(to: GeoPoint, type: DgisRouteType): string {
  return `dgis://2gis.ru/routeSearch/rsType/${type}/to/${coords(to)}`;
}

/** Веб-версия 2gis.kz с точкой на карте: запасной вариант, если приложение не установлено */
export function dgisWebUrl(to: GeoPoint, cityId: CityId): string {
  return `https://2gis.kz/${cityId}/geo/${coords(to)}`;
}

/**
 * Маршрут в приложении 2GIS; если его нет (openURL отклоняется) — сайт 2gis.kz.
 * В браузере deeplink недоступен — сразу открываем сайт (на телефоне с 2GIS его перехватит приложение).
 */
export async function openIn2gis(to: GeoPoint, cityId: CityId, type?: DgisRouteType): Promise<void> {
  const web = dgisWebUrl(to, cityId);
  if (Platform.OS === 'web' || !type) {
    await Linking.openURL(web);
    return;
  }
  try {
    await Linking.openURL(dgisRouteUrl(to, type));
  } catch {
    await Linking.openURL(web);
  }
}
