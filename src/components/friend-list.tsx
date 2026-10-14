import { MessageCircle, Star } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import type { Friend } from '@/api/types';
import { useAppSettings } from '@/state/app-settings';
import { palette, radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { Avatar } from './ui/avatar';
import { Icon } from './ui/icon';
import { Text } from './ui/text';

type Props = {
  friends: Friend[];
  onPick: (userId: string) => void;
  /** Справа в строке (например, «Написать» или отметка «Отправлено») */
  trailing?: (f: Friend) => ReactNode;
};

/** Друзья: «Важные» (топ-5 по переписке) — крупно сверху, как в «Поделиться» Instagram; ниже — все. */
export function FriendList({ friends, onPick, trailing }: Props) {
  const { colors } = useTheme();
  const { t } = useAppSettings();
  const important = friends.filter((f) => f.important);

  return (
    <View style={styles.root}>
      {important.length > 0 ? (
        <View style={styles.block}>
          <View style={styles.title}>
            <Icon icon={Star} size={16} tint={palette.yellow} />
            <Text variant="h3">{t.messages.important}</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.top}>
            {important.map((f) => (
              <Pressable key={f.id} accessibilityRole="button" onPress={() => onPick(f.id)} style={styles.topItem}>
                <View style={[styles.ring, { borderColor: palette.yellow }]}>
                  <Avatar name={f.name} size={60} />
                </View>
                <Text variant="label" numberOfLines={1} style={styles.topName}>
                  {f.name.split(' ')[0]}
                </Text>
                {trailing ? trailing(f) : null}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.block}>
        <Text variant="h3">{t.messages.allFriends}</Text>
        <View style={[styles.list, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          {friends.map((f, i) => (
            <Pressable
              key={f.id}
              onPress={() => onPick(f.id)}
              style={({ pressed }) => [styles.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line }, pressed && { opacity: 0.8 }]}>
              <Avatar name={f.name} size={40} />
              <Text variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
                {f.name}
              </Text>
              {f.important ? <Icon icon={Star} size={14} tint={palette.yellow} /> : null}
              {trailing ? trailing(f) : <Icon icon={MessageCircle} size={18} color="textMuted" />}
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xl },
  block: { gap: spacing.md },
  title: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  top: { gap: spacing.lg },
  topItem: { alignItems: 'center', gap: 4, width: 72 },
  ring: { borderWidth: 2, borderRadius: 40, padding: 2 },
  topName: { maxWidth: 72, textAlign: 'center' },
  list: { borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
});
