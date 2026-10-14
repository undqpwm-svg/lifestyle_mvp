import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { interestById } from '@/api/interests';
import type { EventItem } from '@/api/types';
import { formatEventDate, formatKzt } from '@/lib/format';
import { useAppSettings } from '@/state/app-settings';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { Text } from './ui/text';

// Карточка в стиле макета с сайта: жёлтая плашка цены, места x/y, кто проводит.
export function EventCard({ event }: { event: EventItem }) {
  const { colors } = useTheme();
  const { lang, t } = useAppSettings();
  const interest = interestById.get(event.interestId);
  const left = event.capacity - event.bookedCount;
  const fill = Math.min(event.bookedCount / event.capacity, 1);
  const lowSeats = left > 0 && left <= Math.max(2, Math.ceil(event.capacity * 0.2));
  const status = event.myBooking?.status;

  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.line, opacity: pressed ? 0.9 : 1 },
      ]}>
      <View style={styles.top}>
        <View style={[styles.pill, { backgroundColor: colors.accent }]}>
          <Text variant="label" color="onAccent">
            {event.priceKzt === 0 ? t.common.free : formatKzt(event.priceKzt)}
          </Text>
        </View>
        {status ? (
          <View style={[styles.pill, { backgroundColor: colors.inverse }]}>
            <Text variant="label" color="onInverse">
              {status === 'confirmed' ? `✓ ${t.bookings.confirmed}` : t.bookings.pendingPayment}
            </Text>
          </View>
        ) : lowSeats ? (
          <View style={[styles.pill, { backgroundColor: colors.accentSoft }]}>
            <Text variant="label">{t.events.seatsLeft}</Text>
          </View>
        ) : null}
      </View>

      <Text variant="h3" numberOfLines={2}>
        {interest ? `${interest.emoji} ` : ''}
        {event.title}
      </Text>
      <Text color="textMuted" numberOfLines={1}>
        {event.venue} · {formatEventDate(event.startsAt, lang, t)}
      </Text>

      <View style={styles.bottom}>
        <Text variant="caption" color="textMuted" numberOfLines={1} style={{ flex: 1 }}>
          {event.host.type === 'community' ? '👥 ' : '🏢 '}
          {event.host.name}
          {event.host.verified ? ' ✓' : ''}
        </Text>
        <Text variant="caption">
          {event.bookedCount}/{event.capacity}
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
  pill: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, marginTop: spacing.xs },
  track: { height: 6, borderRadius: radius.pill, overflow: 'hidden' },
  bar: { height: '100%', borderRadius: radius.pill },
});
