import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { Icon } from '../ui/icon';
import { Text } from '../ui/text';

/** Шапка чата как в мессенджерах: назад, аватар, имя и подпись; тап по заголовку — профиль/сообщество. */
export function ChatHeader({ avatar, title, subtitle, onPress, fallback }: { avatar: ReactNode; title: string; subtitle?: string; onPress?: () => void; fallback: () => void }) {
  const { colors } = useTheme();
  return (
    <SafeAreaView edges={['top']} style={[styles.header, { borderBottomColor: colors.line, backgroundColor: colors.background }]}>
      <Pressable accessibilityRole="button" onPress={() => (router.canGoBack() ? router.back() : fallback())} hitSlop={10} style={styles.back}>
        <Icon icon={ArrowLeft} size={22} />
      </Pressable>
      <Pressable style={styles.info} onPress={onPress} disabled={!onPress}>
        {avatar}
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text variant="caption" color="textMuted" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  back: { width: 36, height: 44, justifyContent: 'center' },
  info: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingTop: spacing.sm },
});
