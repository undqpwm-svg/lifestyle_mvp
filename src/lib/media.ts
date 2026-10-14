import type { InterestId } from '@/api/types';

// Фото из Pexels (лицензия Pexels: бесплатно, в т.ч. коммерчески, без обязательной атрибуции).
// Картинки грузятся с CDN на устройстве; если не загрузились — компонент Cover показывает фирменную заглушку.
// Для продакшена фото загружают организаторы, а эти — только для демо-данных.
export function pexels(id: number, width = 1080): string {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${width}`;
}

/** Обложка по категории — для встреч, где организатор не загрузил своё фото. */
export const DEFAULT_COVERS: Record<InterestId, number> = {
  volleyball: 6203560,
  football: 3316945,
  basketball: 11831851,
  tennis: 4536850,
  running: 5319373,
  boardgames: 8111356,
  mafia: 8111358,
  cooking: 1028434,
  workshops: 18999484,
  walks: 8777808,
  music: 5738245,
  tech: 3194521,
};

export const WELCOME_PHOTO = 5738245;
