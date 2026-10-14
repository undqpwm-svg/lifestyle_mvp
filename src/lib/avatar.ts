import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

import type { LocalMedia } from '@/api/types';

const SIZE = 320;

/**
 * Выбор аватарки: квадратная обрезка в системном редакторе, затем сжатие до 320×320 JPEG (~20–40 КБ).
 * null — пользователь отменил; 'denied' — нет доступа к камере/галерее.
 */
export async function pickAvatar(source: 'gallery' | 'camera'): Promise<LocalMedia | null | 'denied'> {
  const perm =
    source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return 'denied';
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 1 };
  const res = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  if (res.canceled) return null;

  const ctx = ImageManipulator.manipulate(res.assets[0].uri);
  const a = res.assets[0];
  ctx.resize(a.width > a.height ? { height: SIZE } : { width: SIZE });
  const image = await ctx.renderAsync();
  // На вебе берём base64: blob-ссылка не переживёт перезагрузку страницы.
  const saved = await image.saveAsync({ compress: 0.75, format: SaveFormat.JPEG, base64: Platform.OS === 'web' });
  const uri = Platform.OS === 'web' && saved.base64 ? `data:image/jpeg;base64,${saved.base64}` : saved.uri;
  return { uri, kind: 'image', mimeType: 'image/jpeg' };
}
