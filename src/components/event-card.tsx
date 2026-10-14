import { router } from 'expo-router';
import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { interestById } from '@/api/interests';
import type { EventItem } from '@/api/types';
import { formatEventDate, formatKzt } from '@/lib/format';
import { DEFAULT_COVERS, pexels } from '@/lib/media';
import { useAppSettings } from '@/state/app-settings';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { HostLabel } from './host-label';
import { INTEREST_ICONS } from './icons';
import { Cover } from './ui/cover';
import { Icon } from './ui/icon';
import { Text } from './ui/text';

export function eventCover(event: Pick<EventItem, 'coverUrl' | 'interestId'>, width?: number) {
  return event.coverUrl ?? pexels(DEFAULT_COVERS[event.interestId], width);
}

// Карточка встречи: фото, плашка цены как на сайте, категория, места x/y и кто проводит.
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
        { backgroundColor: colors.surface, borderColor: colors.line, opacity: pressed ? 0.92 : 1 },
      ]}>
      <Cover uri={eventCover(event, 720)} fallbackIcon={INTEREST_ICONS[event.interestId]} style={styles.cover}>
        <View style={styles.overlay}>
          <View style={[styles.pill, { backgroundColor: colors.accent }]}>
            <Text variant="label" color="onAccent">
              {event.priceKzt === 0 ? t.common.free : formatKzt(event.priceKzt)}
            </Text>
          </View>
          {status ? (
            <View style={[styles.pill, styles.pillRow, { backgroundColor: colors.inverse }]}>
              {status === 'confirmed' ? <Icon icon={Check} size={13} color="onInverse" strokeWidth={3} /> : null}
              <Text variant="label" color="onInverse">
                {status === 'confirmed' ? t.bookings.confirmed : t.bookings.pendingPayment}
              </Text>
            </View>
          ) : lowSeats ? (
            <View style={[styles.pill, { backgroundColor: colors.surface }]}>
              <Text variant="label">{t.events.seatsLeft}</Text>
            </View>
          ) : null}
        </View>
      </Cover>

      <View style={styles.body}>
        <View style={styles.meta}>
          <Icon icon={INTEREST_ICONS[event.interestId]} size={14} color="textMuted" />
          <Text variant="label" color="textMuted" style={styles.upper}>
            {interest?.name[lang]} · {formatEventDate(event.startsAt, lang, t)}
          </Text>
        </View>
        <Text variant="h3" numberOfLines={2}>
          {event.title}
        </Text>
        <Text color="textMuted" numberOfLines={1}>
          {event.venue}
        </Text>

        <View style={styles.bottom}>
          <HostLabel host={event.host} />
          <Text variant="caption">
            {event.bookedCount}/{event.capacity}
          </Text>
        </View>
        <View style={[styles.track, { backgroundColor: colors.surfaceAlt }]}>
          <View style={[styles.bar, { width: `${fill * 100}%`, backgroundColor: colors.inverse }]} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden' },
  cover: { height: 168 },
  overlay: { position: 'absolute', top: spacing.md, left: spacing.md, right: spacing.md, flexDirection: 'row', gap: spacing.sm },
  pill: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill },
  pillRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  body: { padding: spacing.lg, gap: spacing.sm },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  upper: { textTransform: 'uppercase' },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md, marginTop: spacing.xs },
  track: { height: 6, borderRadius: radius.pill, overflow: 'hidden' },
  bar: { height: '100%', borderRadius: radius.pill },
});
