import { router } from 'expo-router';
import { RefreshControl, StyleSheet, View } from 'react-native';

import { useMyBookings } from '@/api/queries';
import { EventCard } from '@/components/event-card';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { EmptyView, ErrorView, LoadingView } from '@/components/ui/state-view';
import { Text } from '@/components/ui/text';
import { useAppSettings } from '@/state/app-settings';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

export default function BookingsScreen() {
  const { colors } = useTheme();
  const { t } = useAppSettings();
  const bookings = useMyBookings();

  return (
    <Screen tabBarInset refreshControl={<RefreshControl refreshing={bookings.isRefetching} onRefresh={bookings.refetch} tintColor={colors.text} />}>
      <Text variant="h1" style={styles.title}>
        {t.bookings.title}
      </Text>
      {bookings.isError && !bookings.data ? (
        <ErrorView onRetry={bookings.refetch} />
      ) : bookings.isPending ? (
        <LoadingView />
      ) : bookings.data.length === 0 ? (
        <EmptyView
          title={t.bookings.empty}
          hint={t.bookings.emptyHint}
          action={<Button title={t.bookings.toFeed} onPress={() => router.navigate('/')} />}
        />
      ) : (
        <View style={styles.list}>
          {bookings.data.map((b) => (
            <EventCard key={b.id} event={b.event} />
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
