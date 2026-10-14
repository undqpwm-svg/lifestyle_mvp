import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/** Сохраняет CSV во временный файл и открывает системное меню «Поделиться» (почта, мессенджер, Файлы). */
export async function exportCsv(filename: string, csv: string): Promise<void> {
  const file = new File(Paths.cache, filename);
  if (file.exists) file.delete();
  file.create();
  file.write(csv);
  await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle: filename, UTI: 'public.comma-separated-values-text' });
}
