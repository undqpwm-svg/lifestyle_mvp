import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Check, ChevronRight, Crown, Hourglass, Info, Megaphone, QrCode, Send, TriangleAlert } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { interestById } from '@/api/interests';
import {
  useBook,
  useCancelBooking,
  useCancelEvent,
  useEvent,
  useEventAttendees,
  useMySubscription,
  usePayBooking,
  usePayEventListing,
  usePromoteEvent,
  useWaitlist,
} from '@/api/queries';
import { useMe } from '@/auth/auth-context';
import { eventCover } from '@/components/event-card';
import { HostLabel } from '@/components/host-label';
import { INTEREST_ICONS } from '@/components/icons';
import { PaymentSheet } from '@/components/payment/payment-sheet';
import { PeopleRow } from '@/components/people-row';
import { ReportButton } from '@/components/report-button';
import { ReviewList } from '@/components/review-list';
import { SeatStepper } from '@/components/seat-stepper';
import { ShareEventSheet } from '@/components/share-event-sheet';
import { Button } from '@/components/ui/button';
import { Cover } from '@/components/ui/cover';
import { Icon, TicketIcon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { EmptyView, ErrorView, LoadingView } from '@/components/ui/state-view';
import { Text } from '@/components/ui/text';
import { LATE_CANCEL_HOURS, LISTING_FEE_KZT, MAX_SEATS_PER_BOOKING, PROMOTION } from '@/config/billing';
import { LEGAL_LINKS } from '@/config/links';
import { errorMessage } from '@/lib/errors';
import { fill, formatDate, formatEventDate, formatKzt } from '@/lib/format';
import { cancelEventReminder, scheduleEventReminder } from '@/lib/push';
import { useNow } from '@/lib/use-now';
import { useAppSettings } from '@/state/app-settings';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';
import { Section } from '@/components/ui/section';

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
  const payListing = usePayEventListing();
  const sub = useMySubscription();
  const waitlist = useWaitlist();
  const promote = usePromoteEvent();
  const attendees = useEventAttendees(id);
  const [seats, setSeats] = useState(1);
  const [sharing, setSharing] = useState(false);
  const now = useNow();
  // Открытое окно оплаты: билет (ID брони и сумму фиксируем при открытии — после оплаты бронь меняет статус,
  // а окно должно остаться, чтобы показать «Оплачено»), размещение или продвижение встречи.
  const [paying, setPaying] = useState<
    { kind: 'booking'; bookingId: string; amount: number } | { kind: 'listing' } | { kind: 'promotion' } | null
  >(null);

  if (isError) return wrap(<ErrorView onRetry={refetch} />);
  if (isPending) return wrap(<LoadingView />);
  if (!event) return wrap(<EmptyView title={t.event.notFound} />);

  const interest = interestById.get(event.interestId);
  const left = event.capacity - event.bookedCount;
  const booking = event.myBooking;
  const isPaid = event.priceKzt > 0;
  const isOwner = event.createdBy === me.id;
  const cancelled = event.status === 'cancelled';
  const unpaid = event.status === 'awaiting_payment';
  const mutationError = [book, cancelBooking, cancelEvent, waitlist].find((m) => m.error)?.error;
  const s = sub.data;
  const passUsable = !!s && s.status !== 'expired' && s.visitsUsed < s.visitsLimit;
  const canUsePass = event.includedInSubscription && passUsable;

  const promoted = !!event.promotedUntil && new Date(event.promotedUntil).getTime() > now;
  const lateCancel = new Date(event.startsAt).getTime() - now < LATE_CANCEL_HOURS * 3_600_000;
  const seatsMax = Math.max(1, Math.min(MAX_SEATS_PER_BOOKING, left));
  const reminder = () => scheduleEventReminder(event).catch(() => {});

  // Платная запись: бронь держит место, затем сразу открывается окно оплаты.
  const bookPaid = () =>
    book.mutate({ eventId: event.id, seats }, { onSuccess: (b) => setPaying({ kind: 'booking', bookingId: b.id, amount: event.priceKzt * b.seats }) });
  const cancelMine = (bookingId: string) =>
    cancelBooking.mutate(bookingId, { onSuccess: () => cancelEventReminder(event.id) });

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
      <Cover uri={eventCover(event, 1200)} fallbackIcon={INTEREST_ICONS[event.interestId]} style={styles.hero} iconSize={56} />
      {interest ? (
        <View style={styles.meta}>
          <Icon icon={INTEREST_ICONS[event.interestId]} size={15} color="textMuted" />
          <Text variant="label" color="textMuted" style={styles.upper}>
            {interest.name[lang]}
          </Text>
        </View>
      ) : null}
      <Text variant="h2">{event.title}</Text>

      <Pressable onPress={openHost} style={[styles.host, { backgroundColor: colors.surfaceAlt }]}>
        <Text variant="caption" color="textMuted">
          {t.event.host}
        </Text>
        <View style={{ flex: 1 }}>
          <HostLabel host={event.host} variant="bodyStrong" color="text" />
        </View>
        <Icon icon={ChevronRight} size={18} color="textFaint" />
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

      {event.friendsGoing.length > 0 || (attendees.data?.length ?? 0) > 0 ? (
        <Section title={t.event.attendees}>
          <PeopleRow people={[...event.friendsGoing, ...(attendees.data ?? []).filter((a) => a.id !== me.id && !event.friendsGoing.some((f) => f.id === a.id))]} />
        </Section>
      ) : null}

      {/* Совместная запись: до 5 мест одним платежом (по подписке — только себе) */}
      {!booking && !cancelled && !unpaid && left > 0 && !canUsePass ? (
        <View style={[styles.seats, { borderColor: colors.line }]}>
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">{t.event.seats}</Text>
            <Text variant="caption" color="textMuted">
              {seats > 1 && isPaid ? `${formatKzt(event.priceKzt * seats)} · ` : ''}
              {t.event.seatsHint}
            </Text>
          </View>
          <SeatStepper value={seats} max={seatsMax} onChange={setSeats} />
        </View>
      ) : null}

      {/* Блок действия зависит от состояния встречи и брони */}
      {unpaid && isOwner ? (
        <>
          <View style={[styles.notice, { backgroundColor: colors.accentSoft }]}>
            <Text variant="bodyStrong">{t.event.unpaidTitle}</Text>
            <Text variant="caption" color="textMuted">
              {t.event.unpaidHint}
            </Text>
          </View>
          <Button title={`${t.event.payListing} · ${formatKzt(LISTING_FEE_KZT)}`} onPress={() => setPaying({ kind: 'listing' })} />
        </>
      ) : cancelled ? (
        <View style={[styles.banner, { backgroundColor: colors.surfaceAlt }]}>
          <Text variant="bodyStrong">{t.event.cancelled}</Text>
        </View>
      ) : booking?.status === 'confirmed' ? (
        <>
          <View style={[styles.banner, { backgroundColor: colors.accentSoft }]}>
            <Icon icon={booking.viaSubscription ? Crown : Check} size={18} strokeWidth={booking.viaSubscription ? 2 : 3} />
            <Text variant="bodyStrong">{booking.viaSubscription ? t.event.bookedViaPass : t.event.booked}</Text>
          </View>
          <Button title={t.event.ticket} icon={TicketIcon} variant="dark" onPress={() => router.push({ pathname: '/ticket/[bookingId]', params: { bookingId: booking.id } })} />
          {booking.viaSubscription && lateCancel ? (
            <View style={styles.hint}>
              <Icon icon={TriangleAlert} size={14} color="textMuted" />
              <Text variant="caption" color="textMuted" style={{ flexShrink: 1 }}>
                {t.event.lateCancelWarn}
              </Text>
            </View>
          ) : null}
          <Button title={t.event.cancelBooking} variant="ghost" loading={cancelBooking.isPending} onPress={() => cancelMine(booking.id)} />
        </>
      ) : booking?.status === 'pending_payment' ? (
        <>
          <Button
            title={`${t.payment.pay} · ${formatKzt(event.priceKzt * booking.seats)}`}
            onPress={() => setPaying({ kind: 'booking', bookingId: booking.id, amount: event.priceKzt * booking.seats })}
          />
          <View style={styles.hint}>
            <Icon icon={Info} size={14} color="textMuted" />
            <Text variant="caption" color="textMuted">
              {t.event.payHint}
            </Text>
          </View>
          <Button title={t.event.cancelBooking} variant="ghost" loading={cancelBooking.isPending} onPress={() => cancelMine(booking.id)} />
        </>
      ) : left <= 0 ? (
        // Мест нет — лист ожидания: освободившееся место автоматически предлагается первому в очереди.
        event.myWaitlistPosition ? (
          <>
            <View style={[styles.banner, { backgroundColor: colors.accentSoft }]}>
              <Icon icon={Hourglass} size={18} />
              <Text variant="bodyStrong">{fill(t.event.waitlistPos, { n: event.myWaitlistPosition })}</Text>
            </View>
            <Button title={t.event.waitlistLeave} variant="ghost" loading={waitlist.isPending} onPress={() => waitlist.mutate({ eventId: event.id, join: false })} />
          </>
        ) : (
          <>
            <Button title={t.event.waitlistJoin} icon={Hourglass} variant="dark" loading={waitlist.isPending} onPress={() => waitlist.mutate({ eventId: event.id, join: true })} />
            <Text variant="caption" color="textMuted" style={styles.center}>
              {t.event.waitlistHint}
            </Text>
          </>
        )
      ) : canUsePass ? (
        <>
          <Button
            title={t.event.viaPass}
            icon={Crown}
            loading={book.isPending}
            onPress={() => book.mutate({ eventId: event.id, useSubscription: true }, { onSuccess: reminder })}
          />
          <Button title={`${t.event.orPay} ${formatKzt(event.priceKzt)}`} variant="ghost" onPress={bookPaid} />
        </>
      ) : isPaid ? (
        <>
          <Button title={t.event.bookPaid} loading={book.isPending} onPress={bookPaid} />
          {event.includedInSubscription ? (
            <Pressable onPress={() => router.push('/subscription')} style={styles.hint}>
              <Icon icon={Crown} size={14} color="textMuted" />
              <Text variant="caption" color="textMuted" style={styles.link}>
                {t.event.passHint}
              </Text>
            </Pressable>
          ) : null}
        </>
      ) : (
        <Button title={t.event.book} loading={book.isPending} onPress={() => book.mutate({ eventId: event.id, seats }, { onSuccess: reminder })} />
      )}

      {mutationError ? (
        <Text variant="caption" color="danger" style={styles.center}>
          {errorMessage(mutationError, t)}
        </Text>
      ) : null}

      {!cancelled && !unpaid ? (
        <Button title={t.messages.share} icon={Send} variant="ghost" onPress={() => setSharing(true)} />
      ) : null}
      {sharing ? <ShareEventSheet event={event} onClose={() => setSharing(false)} /> : null}

      {!cancelled && !unpaid ? (
        <Text variant="caption" color="textFaint" style={[styles.center, styles.link]} onPress={() => WebBrowser.openBrowserAsync(LEGAL_LINKS.offer)}>
          {t.event.offerNote}
        </Text>
      ) : null}

      {/* Инструменты организатора */}
      {isOwner && event.status === 'published' ? (
        <View style={[styles.tools, { borderColor: colors.line }]}>
          <Button
            title={t.event.checkin}
            icon={QrCode}
            variant="dark"
            onPress={() => router.push({ pathname: '/event/[id]/checkin', params: { id: event.id } })}
          />
          {event.host.type === 'organization' ? (
            <>
              <Button title={t.event.promote} icon={Megaphone} variant="ghost" onPress={() => setPaying({ kind: 'promotion' })} />
              <Text variant="caption" color="textMuted" style={styles.center}>
                {promoted
                  ? fill(t.event.promotedUntil, { date: formatDate(event.promotedUntil!, lang) })
                  : fill(t.event.promoteHint, { price: formatKzt(PROMOTION.priceKzt), days: PROMOTION.days })}
              </Text>
            </>
          ) : null}
        </View>
      ) : null}

      {isOwner && !cancelled ? (
        <Button title={t.event.cancelEvent} variant="ghost" loading={cancelEvent.isPending} onPress={() => cancelEvent.mutate(event.id)} />
      ) : null}

      {!isOwner ? (
        <View style={styles.center}>
          <ReportButton target="event" targetId={event.id} />
        </View>
      ) : null}
      <ReviewList hostType={event.host.type} hostId={event.host.id} limit={3} />

      {paying?.kind === 'booking' ? (
        <PaymentSheet
          amountKzt={paying.amount}
          purpose="booking"
          pay={(payment) => pay.mutateAsync({ bookingId: paying.bookingId, payment }).then(reminder)}
          onClose={() => setPaying(null)}
        />
      ) : null}
      {paying?.kind === 'promotion' ? (
        <PaymentSheet
          amountKzt={PROMOTION.priceKzt}
          purpose="promotion"
          pay={(payment) => promote.mutateAsync({ eventId: event.id, payment })}
          onClose={() => setPaying(null)}
        />
      ) : null}
      {paying?.kind === 'listing' ? (
        <PaymentSheet
          amountKzt={LISTING_FEE_KZT}
          purpose="listing"
          pay={(payment) => payListing.mutateAsync({ eventId: event.id, payment })}
          onClose={() => setPaying(null)}
        />
      ) : null}
    </View>,
  );
}

function wrap(children: React.ReactNode) {
  return <Screen edges={['bottom']}>{children}</Screen>;
}

const styles = StyleSheet.create({
  body: { gap: spacing.lg },
  hero: { height: 240, marginHorizontal: -spacing.lg, marginBottom: spacing.xs },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  upper: { textTransform: 'uppercase' },
  hint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  host: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.md },
  table: { borderRadius: radius.lg, borderWidth: 1 },
  row: { flexDirection: 'row', padding: spacing.lg, gap: spacing.lg },
  key: { width: 96 },
  value: { flex: 1 },
  notice: { padding: spacing.lg, borderRadius: radius.md, gap: spacing.xs },
  banner: { padding: spacing.lg, borderRadius: radius.md, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.sm },
  center: { textAlign: 'center', alignItems: 'center' },
  link: { textDecorationLine: 'underline' },
  seats: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: radius.md, borderWidth: 1 },
  tools: { gap: spacing.md, paddingTop: spacing.lg, borderTopWidth: StyleSheet.hairlineWidth },
});
