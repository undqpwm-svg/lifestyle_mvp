import { Camera, ImageIcon, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { useUpdateAvatar } from '@/api/queries';
import { pickAvatar } from '@/lib/avatar';
import { useAppSettings } from '@/state/app-settings';
import { palette } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { Avatar } from './ui/avatar';
import { Icon } from './ui/icon';
import { Sheet, SheetOption } from './ui/sheet';
import { Text } from './ui/text';

/** Аватар с кнопкой-камерой: тап — выбрать/снять/удалить фото. */
export function AvatarPicker({ name, uri, size = 88, onError }: { name: string; uri?: string; size?: number; onError?: (text: string) => void }) {
  const { colors } = useTheme();
  const { t } = useAppSettings();
  const update = useUpdateAvatar();
  const [open, setOpen] = useState(false);

  const choose = async (source: 'gallery' | 'camera') => {
    setOpen(false);
    const file = await pickAvatar(source).catch(() => null);
    if (file === 'denied') return onError?.(t.chat.photosDenied);
    if (file) update.mutate(file);
  };

  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel={t.profile.avatar} onPress={() => setOpen(true)} style={{ width: size, height: size }}>
        <Avatar name={name} uri={uri} size={size} />
        {update.isPending ? (
          <View style={[StyleSheet.absoluteFill, styles.loading, { borderRadius: size / 2 }]}>
            <ActivityIndicator color={palette.cream} />
          </View>
        ) : null}
        <View style={[styles.badge, { backgroundColor: colors.accent, borderColor: colors.background }]}>
          <Icon icon={Camera} size={size > 60 ? 16 : 12} color="onAccent" />
        </View>
      </Pressable>
      <Sheet visible={open} onClose={() => setOpen(false)} title={t.profile.avatar}>
        <SheetOption icon={ImageIcon} label={t.profile.avatarChoose} onPress={() => choose('gallery')} />
        <SheetOption icon={Camera} label={t.profile.avatarTake} onPress={() => choose('camera')} />
        {uri ? (
          <SheetOption
            icon={Trash2}
            label={t.profile.avatarRemove}
            onPress={() => {
              setOpen(false);
              update.mutate(null);
            }}
          />
        ) : null}
      </Sheet>
      {update.isError ? <Text variant="caption" color="danger">{t.errors.server}</Text> : null}
    </>
  );
}

const styles = StyleSheet.create({
  loading: { backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
