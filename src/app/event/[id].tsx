import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Pressable, StyleSheet, View } from 'react-native';

import { interestById } from '@/api/interests';
import { useBook, useCancelBooking, useCancelEvent, useEvent, usePayBooking } from '@/api/queries';
import { useMe } from '@/auth/auth-context';
import { ReportButton } from '@/components/report-button';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { EmptyView, ErrorView, LoadingView } from '@/components/ui/state-view';
import { Text } from '@/components/ui/text';
import { LEGAL_LINKS } from '@/config/links';
import { errorMessage } from '@/lib/errors';
import { formatEventDate, formatKzt } from '@/lib/format';
import { useAppSettings } from '@/state/app-settings';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

export default function EventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const me = useMe();
  const { lang, t } = useAppSettings();
  const { data: event, isPending, isError, refetch } = useEvent(id);
  const book = useBook();
  const pay = usePayBooking();
  const cancelBooking = useCancelBooking();
  const cancelEvent = useCancelEvent();

  if (isError) return wrap(<ErrorView onRetry={refetch} />);
  if (isPending) return wrap(<LoadingView />);
  if (!event) return wrap(<EmptyView title={t.event.notFound} />);

  const interest = interestById.get(event.interestId);
  const left = event.capacity - event.bookedCount;
  const booking = event.myBooking;
  const isPaid = event.priceKzt > 0;
  const isOwner = event.createdBy === me.id;
  const cancelled = event.status === 'cancelled';
  const mutationError = [book, pay, cancelBooking, cancelEvent].find((m) => m.error)?.error;

  const openHost = () =>
    event.host.type === 'organization'
      ? router.push({ pathname: '/org/[id]', params: { id: event.host.id } })
      : router.push({ pathname: '/community/[id]', params: { id: event.host.id } });

  const rows: [string, string][] = [
    [t.event.when, formatEventDate(event.startsAt, lang, t)],
    [t.event.place, `${event.venue}\n${event.address}`],
    [t.event.price, isPaid ? formatKzt(event.priceKzt) : t.common.free],
    [t.event.participants, `${event.bookedCount}/${event.capacity}`],
  ];

  return wrap(
    <View style={styles.body}>
      {interest ? (
        <Text variant="caption" color="textMuted">
          {interest.emoji} {interest.name[lang]}
        </Text>
      ) : null}
      <Text variant="h2">{event.title}</Text>

      <Pressable onPress={openHost} style={[styles.host, { backgroundColor: colors.surfaceAlt }]}>
        <Text variant="caption" color="textMuted">
          {t.event.host}
        </Text>
        <Text variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
          {event.host.type === 'community' ? '👥 ' : '🏢 '}
          {event.host.name}
          {event.host.verified ? `  ✓ ${t.common.verified}` : ''}
        </Text>
        <Text color="textFaint">›</Text>
      </Pressable>

      {event.description ? <Text color="textMuted">{event.description}</Text> : null}

      <View style={[styles.table, { backgroundColor: colors.surface, borderColor: colors.line }]}>
        {rows.map(([k, v], i) => (
          <View
            key={k}
            style={[styles.row, i < rows.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line }]}>
            <Text variant="caption" color="textMuted" style={styles.key}>
              {k}
            </Text>
            <Text variant="bodyStrong" style={styles.value}>
              {v}
            </Text>
          </View>
        ))}
      </View>

      {/* Блок действия зависит от состояния брони */}
      {cancelled ? (
        <View style={[styles.banner, { backgroundColor: colors.surfaceAlt }]}>
          <Text variant="bodyStrong">{t.event.cancelled}</Text>
        </View>
      ) : booking?.status === 'confirmed' ? (
        <>
          <View style={[styles.banner, { backgroundColor: colors.accentSoft }]}>
            <Text variant="bodyStrong">✓ {t.event.booked}</Text>
          </View>
          <Button title={t.event.cancelBooking} variant="ghost" loading={cancelBooking.isPending} onPress={() => cancelBooking.mutate(booking.id)} />
        </>
      ) : booking?.status === 'pending_payment' ? (
        <>
          {/* TODO: реальная оплата — создание платежа Kaspi на бэкенде и подтверждение по вебхуку */}
          <Button title={`${t.event.pay} · ${formatKzt(event.priceKzt)}`} loading={pay.isPending} onPress={() => pay.mutate(booking.id)} />
          <Text variant="caption" color="textMuted" style={styles.center}>
            {t.event.payHint}
          </Text>
          <Button title={t.event.cancelBooking} variant="ghost" loading={cancelBooking.isPending} onPress={() => cancelBooking.mutate(booking.id)} />
        </>
      ) : (
        <Button
          title={left <= 0 ? t.event.full : isPaid ? t.event.bookPaid : t.event.book}
          disabled={left <= 0}
          loading={book.isPending}
          onPress={() => book.mutate(event.id)}
        />
      )}

      {mutationError ? (
        <Text variant="caption" color="danger" style={styles.center}>
          {errorMessage(mutationError, t)}
        </Text>
      ) : null}

      {!cancelled ? (
        <Text variant="caption" color="textFaint" style={[styles.center, styles.link]} onPress={() => WebBrowser.openBrowserAsync(LEGAL_LINKS.offer)}>
          {t.event.offerNote}
        </Text>
      ) : null}

      {isOwner && !cancelled ? (
        <Button title={t.event.cancelEvent} variant="ghost" loading={cancelEvent.isPending} onPress={() => cancelEvent.mutate(event.id)} />
      ) : null}

      {!isOwner ? (
        <View style={styles.center}>
          <ReportButton target="event" targetId={event.id} />
        </View>
      ) : null}
    </View>,
  );
}

function wrap(children: React.ReactNode) {
  return <Screen edges={['bottom']}>{children}</Screen>;
}

const styles = StyleSheet.create({
  body: { gap: spacing.lg, paddingTop: spacing.lg },
  host: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.md },
  table: { borderRadius: radius.lg, borderWidth: 1 },
  row: { flexDirection: 'row', padding: spacing.lg, gap: spacing.lg },
  key: { width: 96 },
  value: { flex: 1 },
  banner: { padding: spacing.lg, borderRadius: radius.md, alignItems: 'center' },
  center: { textAlign: 'center', alignItems: 'center' },
  link: { textDecorationLine: 'underline' },
});
