import { useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Linking, StyleSheet, View } from 'react-native';

import { api } from '@/api/client';
import { useQuery } from '@/api/use-query';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { EmptyView, ErrorView, LoadingView } from '@/components/ui/state-view';
import { Text } from '@/components/ui/text';
import { botStartLink, LEGAL_LINKS } from '@/config/links';
import { formatEventDate, formatKzt } from '@/lib/format';
import { useAppSettings } from '@/state/app-settings';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

export default function EventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { lang, t, bookedEventIds, addBooking } = useAppSettings();
  const { data: event, error, loading, reload } = useQuery(() => api.event(id), [id]);

  if (error) return wrap(<ErrorView onRetry={reload} />);
  if (loading && !event) return wrap(<LoadingView />);
  if (!event) return wrap(<EmptyView title={t.event.notFound} />);

  const left = event.capacity - event.booked;
  const isBooked = bookedEventIds.includes(event.id);

  // MVP: запись и оплата идут в боте. payload ev_<id> бот разбирает в /start
  // и сразу открывает карточку встречи. Позже — нативная оплата Kaspi через API.
  const book = async () => {
    await Linking.openURL(botStartLink(`ev_${event.id}`));
    addBooking(event.id);
  };

  const rows: [string, string][] = [
    [t.event.when, formatEventDate(event.startsAt, lang, t)],
    [t.event.place, `${event.venue}\n${event.address}`],
    [t.event.price, event.priceKzt === 0 ? t.common.free : formatKzt(event.priceKzt)],
    [t.event.participants, `${event.booked}/${event.capacity}`],
    [t.event.organizer, `${event.organizer.name} · ★${event.organizer.rating.toFixed(1)}`],
  ];

  return wrap(
    <View style={styles.body}>
      <Text variant="h2">{event.title[lang]}</Text>
      <Text color="textMuted">{event.description[lang]}</Text>

      <View style={[styles.table, { backgroundColor: colors.surface, borderColor: colors.line }]}>
        {rows.map(([k, v], i) => (
          <View
            key={k}
            style={[
              styles.row,
              i < rows.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
            ]}>
            <Text variant="caption" color="textMuted" style={styles.key}>
              {k}
            </Text>
            <Text variant="bodyStrong" style={styles.value}>
              {v}
            </Text>
          </View>
        ))}
      </View>

      <Button
        title={isBooked ? t.event.booked : left <= 0 ? t.event.full : t.event.book}
        disabled={isBooked || left <= 0}
        onPress={book}
      />
      <Text
        variant="caption"
        color="textFaint"
        style={styles.note}
        onPress={() => WebBrowser.openBrowserAsync(LEGAL_LINKS.offer)}>
        {t.event.offerNote}
      </Text>
    </View>,
  );
}

function wrap(children: React.ReactNode) {
  return <Screen edges={['bottom']}>{children}</Screen>;
}

const styles = StyleSheet.create({
  body: { gap: spacing.lg, paddingTop: spacing.lg },
  table: { borderRadius: radius.lg, borderWidth: 1 },
  row: { flexDirection: 'row', padding: spacing.lg, gap: spacing.lg },
  key: { width: 96 },
  value: { flex: 1 },
  note: { textAlign: 'center', textDecorationLine: 'underline' },
});
