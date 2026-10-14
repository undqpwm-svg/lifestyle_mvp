import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { api } from '@/api/client';
import type { EventItem } from '@/api/types';
import { useQuery } from '@/api/use-query';
import { EventCard } from '@/components/event-card';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { EmptyView, ErrorView, LoadingView } from '@/components/ui/state-view';
import { Text } from '@/components/ui/text';
import { useAppSettings } from '@/state/app-settings';
import { spacing } from '@/theme/tokens';

export default function BookingsScreen() {
  const { t, bookedEventIds } = useAppSettings();
  const key = bookedEventIds.join(',');
  const { data, error, reload } = useQuery(
    async () =>
      (await Promise.all(bookedEventIds.map((id) => api.event(id)))).filter(
        (e): e is EventItem => e !== null,
      ),
    [key],
  );

  return (
    <Screen>
      <Text variant="h1" style={styles.title}>
        {t.bookings.title}
      </Text>
      {bookedEventIds.length === 0 ? (
        <EmptyView
          title={t.bookings.empty}
          hint={t.bookings.emptyHint}
          action={<Button title={t.bookings.toFeed} onPress={() => router.navigate('/')} />}
        />
      ) : error ? (
        <ErrorView onRetry={reload} />
      ) : !data ? (
        <LoadingView />
      ) : (
        <View style={styles.list}>
          {data.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { paddingTop: spacing.lg, paddingBottom: spacing.xl },
  list: { gap: spacing.md },
});
