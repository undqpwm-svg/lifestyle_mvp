import { router } from 'expo-router';
import { Star } from 'lucide-react-native';
import { useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';

import { useMyBookings } from '@/api/queries';
import { EventCard } from '@/components/event-card';
import { Stars } from '@/components/stars';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Segmented } from '@/components/ui/segmented';
import { EmptyView, ErrorView, LoadingView } from '@/components/ui/state-view';
import { Text } from '@/components/ui/text';
import { useNow } from '@/lib/use-now';
import { useAppSettings } from '@/state/app-settings';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

export default function BookingsScreen() {
  const { colors } = useTheme();
  const { t } = useAppSettings();
  const bookings = useMyBookings();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const now = useNow();

  // Встреча считается прошедшей после окончания (начало + длительность)
  const isPast = (startsAt: string, durationMin: number) => new Date(startsAt).getTime() + durationMin * 60_000 < now;
  const all = bookings.data ?? [];
  const list = all.filter((b) => isPast(b.event.startsAt, b.event.durationMin) === (tab === 'past'));
  if (tab === 'past') list.reverse();

  return (
    <Screen tabBarInset refreshControl={<RefreshControl refreshing={bookings.isRefetching} onRefresh={bookings.refetch} tintColor={colors.text} />}>
      <Text variant="h1" style={styles.title}>
        {t.bookings.title}
      </Text>
      <Segmented
        stretch
        value={tab}
        onChange={setTab}
        options={[
          { id: 'upcoming', label: t.bookings.upcoming },
          { id: 'past', label: t.bookings.past },
        ]}
      />
      <View style={{ height: spacing.lg }} />
      {bookings.isError && !bookings.data ? (
        <ErrorView onRetry={bookings.refetch} />
      ) : bookings.isPending ? (
        <LoadingView />
      ) : list.length === 0 ? (
        <EmptyView
          title={t.bookings.empty}
          hint={tab === 'upcoming' ? t.bookings.emptyHint : undefined}
          action={tab === 'upcoming' ? <Button title={t.bookings.toFeed} onPress={() => router.navigate('/')} /> : undefined}
        />
      ) : (
        <View style={styles.list}>
          {list.map((b) => (
            <View key={b.id} style={styles.item}>
              <EventCard event={b.event} />
              {b.myReview ? (
                <View style={styles.rated}>
                  <Text variant="caption" color="textMuted">
                    {t.bookings.yourRating}
                  </Text>
                  <Stars value={b.myReview.rating} size={14} />
                </View>
              ) : b.canReview ? (
                <Button title={t.bookings.rate} icon={Star} variant="ghost" onPress={() => router.push({ pathname: '/review/[bookingId]', params: { bookingId: b.id } })} />
              ) : null}
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { paddingTop: spacing.lg, paddingBottom: spacing.lg },
  list: { gap: spacing.lg },
  item: { gap: spacing.sm },
  rated: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.sm },
});
