import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Category, EventItem } from '@/api/types';
import { formatEventDate, formatKzt } from '@/lib/format';
import { useAppSettings } from '@/state/app-settings';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { Text } from './ui/text';

// Карточка в стиле макета телефона с сайта: жёлтая плашка цены, места x/y, организатор с рейтингом.
export function EventCard({ event, category }: { event: EventItem; category?: Category }) {
  const { colors } = useTheme();
  const { lang, t } = useAppSettings();
  const left = event.capacity - event.booked;
  const fill = Math.min(event.booked / event.capacity, 1);
  const lowSeats = left > 0 && left <= Math.max(2, Math.ceil(event.capacity * 0.2));

  return (
      <Pressable
        accessibilityRole="link"
        onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.line, opacity: pressed ? 0.9 : 1 },
        ]}>
        <View style={styles.top}>
          <View style={[styles.price, { backgroundColor: colors.accent }]}>
            <Text variant="label" color="onAccent">
              {event.priceKzt === 0 ? t.common.free : formatKzt(event.priceKzt)}
            </Text>
          </View>
          {lowSeats ? (
            <View style={[styles.badge, { backgroundColor: colors.accentSoft }]}>
              <Text variant="label">{t.events.seatsLeft}</Text>
            </View>
          ) : null}
        </View>

        <Text variant="h3" numberOfLines={2}>
          {category ? `${category.emoji} ` : ''}
          {event.title[lang]}
        </Text>
        <Text color="textMuted" numberOfLines={1}>
          {event.venue} · {formatEventDate(event.startsAt, lang, t)}
        </Text>

        <View style={styles.bottom}>
          <Text variant="caption" color="textMuted">
            {event.organizer.name} · ★{event.organizer.rating.toFixed(1)}
          </Text>
          <Text variant="caption">
            {event.booked}/{event.capacity}
          </Text>
        </View>
        <View style={[styles.track, { backgroundColor: colors.surfaceAlt }]}>
          <View style={[styles.bar, { width: `${fill * 100}%`, backgroundColor: colors.inverse }]} />
        </View>
      </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg, gap: spacing.sm },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  price: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill },
  badge: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
  track: { height: 6, borderRadius: radius.pill, overflow: 'hidden' },
  bar: { height: '100%', borderRadius: radius.pill },
});
