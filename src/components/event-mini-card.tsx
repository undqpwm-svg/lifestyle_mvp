import { router } from 'expo-router';
import { Users } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import type { EventItem } from '@/api/types';
import { fill, formatEventDate, formatKzt } from '@/lib/format';
import { useAppSettings } from '@/state/app-settings';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { eventCover } from './event-card';
import { INTEREST_ICONS } from './icons';
import { Cover } from './ui/cover';
import { Icon } from './ui/icon';
import { Text } from './ui/text';

/** Компактная карточка: карусель «Для вас», выбранная метка на карте. */
export function EventMiniCard({ event, width = 260 }: { event: EventItem; width?: number | `${number}%` }) {
  const { colors } = useTheme();
  const { t, lang } = useAppSettings();
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}
      style={({ pressed }) => [styles.card, { width, backgroundColor: colors.surface, borderColor: colors.line, opacity: pressed ? 0.92 : 1 }]}>
      <Cover uri={eventCover(event, 480)} fallbackIcon={INTEREST_ICONS[event.interestId]} style={styles.cover} iconSize={28}>
        <View style={[styles.price, { backgroundColor: colors.accent }]}>
          <Text variant="label" color="onAccent">
            {event.priceKzt === 0 ? t.common.free : formatKzt(event.priceKzt)}
          </Text>
        </View>
      </Cover>
      <View style={styles.body}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {event.title}
        </Text>
        <Text variant="caption" color="textMuted" numberOfLines={1}>
          {formatEventDate(event.startsAt, lang, t)} · {event.venue}
        </Text>
        {event.friendsGoing.length > 0 ? (
          <View style={styles.friends}>
            <Icon icon={Users} size={13} color="text" />
            <Text variant="label" numberOfLines={1} style={{ flex: 1 }}>
              {fill(t.events.friendsGoing, { names: event.friendsGoing.map((f) => f.name.split(' ')[0]).join(', ') })}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden' },
  cover: { height: 120 },
  price: { position: 'absolute', top: spacing.sm, left: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.pill },
  body: { padding: spacing.md, gap: 2 },
  friends: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
});
