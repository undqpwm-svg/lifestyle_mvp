import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Info, Store, Users } from 'lucide-react-native';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';

import { useCreateEvent, useMyCommunities, useMyOrganizations, usePayEventListing } from '@/api/queries';
import type { HostRef, HostType, InterestId } from '@/api/types';
import { InterestPicker } from '@/components/interest-picker';
import { PaymentSheet } from '@/components/payment/payment-sheet';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { Sheet, SheetOption } from '@/components/ui/sheet';
import { EmptyView, LoadingView } from '@/components/ui/state-view';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { LISTING_FEE_KZT } from '@/config/billing';
import { intlLocale } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import { formatKzt } from '@/lib/format';
import { useAppSettings } from '@/state/app-settings';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

const DAYS_AHEAD = 21;

/** Ближайшие даты для выбора чипами (полноценный DateTimePicker — следующей итерацией). */
function upcomingDays(): Date[] {
  return Array.from({ length: DAYS_AHEAD }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + i);
    return d;
  });
}

const intOr = (v: string, fallback: number) => (/^\d+$/.test(v) ? parseInt(v, 10) : fallback);

export default function NewEventScreen() {
  const params = useLocalSearchParams<{ hostType?: HostType; hostId?: string }>();
  const { colors } = useTheme();
  const { t, lang } = useAppSettings();
  const orgs = useMyOrganizations();
  const communities = useMyCommunities();
  const create = useCreateEvent();
  const payListing = usePayEventListing();
  // Созданная встреча организации, ожидающая оплаты размещения
  const [unpaidId, setUnpaidId] = useState<string | null>(null);

  // От чьего имени можно публиковать: свои организации (кроме отклонённых)
  // и сообщества, где пользователь владелец или модератор.
  const hosts = useMemo<(HostRef & { address?: string })[]>(
    () => [
      ...(orgs.data ?? [])
        .filter((o) => o.status !== 'rejected')
        .map((o) => ({ type: 'organization' as const, id: o.id, name: o.name, verified: o.status === 'verified', address: o.address })),
      ...(communities.data ?? [])
        .filter((c) => c.myRole === 'owner' || c.myRole === 'moderator')
        .map((c) => ({ type: 'community' as const, id: c.id, name: c.name, verified: false })),
    ],
    [orgs.data, communities.data],
  );

  const [hostKey, setHostKey] = useState<string | null>(params.hostId ? `${params.hostType}:${params.hostId}` : null);
  const [hostOpen, setHostOpen] = useState(false);
  const [interestId, setInterestId] = useState<InterestId | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [day, setDay] = useState(0);
  const [time, setTime] = useState('19:00');
  const [duration, setDuration] = useState('120');
  const [venue, setVenue] = useState('');
  const [address, setAddress] = useState('');
  const [price, setPrice] = useState('0');
  const [capacity, setCapacity] = useState('12');
  const [inPass, setInPass] = useState(false);
  const [days] = useState(upcomingDays);
  const [openedAt] = useState(() => Date.now());

  // По умолчанию — первый доступный организатор.
  const host = hosts.find((h) => `${h.type}:${h.id}` === hostKey) ?? hosts[0] ?? null;
  const canCharge = host?.type === 'organization' && host.verified;
  // Площадка и адрес по умолчанию берутся из организации, пока пользователь не ввёл свои.
  const venueValue = venue || (host?.type === 'organization' ? host.name : '');
  const addressValue = address || host?.address || '';
  const priceValue = canCharge ? price : '0';
  const isOrg = host?.type === 'organization';
  const passAllowed = canCharge && intOr(priceValue, 0) > 0;

  const startsAt = useMemo(() => {
    const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(time.trim());
    if (!m) return null;
    const d = new Date(days[day]);
    d.setHours(+m[1], +m[2], 0, 0);
    // Сравниваем с моментом открытия формы; окончательно время проверяет сервер.
    return d.getTime() > openedAt ? d : null;
  }, [time, day, days, openedAt]);

  const valid = !!host && !!interestId && title.trim().length >= 3 && !!startsAt && !!venueValue.trim() && intOr(capacity, 0) >= 2;

  const submit = () => {
    if (!host || !interestId || !startsAt) return;
    create.mutate(
      {
        host: { type: host.type, id: host.id },
        interestId,
        title,
        description,
        venue: venueValue.trim(),
        address: addressValue.trim(),
        startsAt: startsAt.toISOString(),
        durationMin: intOr(duration, 120),
        priceKzt: intOr(priceValue, 0),
        capacity: intOr(capacity, 0),
        includedInSubscription: passAllowed && inPass,
      },
      {
        onSuccess: (e) =>
          e.status === 'awaiting_payment' ? setUnpaidId(e.id) : router.replace({ pathname: '/event/[id]', params: { id: e.id } }),
      },
    );
  };

  if (orgs.isPending || communities.isPending) return <Screen edges={['bottom']}><LoadingView /></Screen>;

  if (hosts.length === 0) {
    return (
      <Screen edges={['bottom']}>
        <EmptyView
          title={t.eventForm.noHosts}
          action={
            <View style={{ gap: spacing.md, alignSelf: 'stretch' }}>
              <Button title={t.create.organization} onPress={() => router.replace('/org/new')} />
              <Button title={t.create.community} variant="ghost" onPress={() => router.replace('/community/new')} />
            </View>
          }
        />
      </Screen>
    );
  }

  const dayLabel = (d: Date, i: number) =>
    i === 0 ? t.events.today : i === 1 ? t.events.tomorrow : d.toLocaleDateString(intlLocale[lang], { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <Screen edges={['bottom']}>
      <View style={styles.form}>
        <View style={styles.block}>
          <Text variant="caption" color="textMuted">{t.eventForm.host}</Text>
          <SheetOption
            icon={host?.type === 'community' ? Users : Store}
            label={host?.name ?? '—'}
            hint={host?.verified ? t.common.verified : undefined}
            onPress={() => setHostOpen(true)}
          />
        </View>

        <View style={styles.block}>
          <Text variant="caption" color="textMuted">{t.eventForm.category}</Text>
          <InterestPicker value={interestId} onChange={setInterestId} />
        </View>

        <TextField label={t.eventForm.name} placeholder={t.eventForm.namePlaceholder} value={title} onChangeText={setTitle} maxLength={80} />
        <TextField
          label={t.eventForm.description}
          placeholder={t.eventForm.descriptionPlaceholder}
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={2000}
        />

        <View style={styles.block}>
          <Text variant="caption" color="textMuted">{t.eventForm.date}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
            {days.map((d, i) => (
              <Chip key={i} label={dayLabel(d, i)} active={day === i} onPress={() => setDay(i)} />
            ))}
          </ScrollView>
        </View>

        <View style={styles.row}>
          <View style={styles.col}>
            <TextField
              label={t.eventForm.time}
              value={time}
              onChangeText={setTime}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
              error={time.length >= 4 && !startsAt ? t.eventForm.invalidTime : null}
            />
          </View>
          <View style={styles.col}>
            <TextField label={t.eventForm.duration} value={duration} onChangeText={setDuration} keyboardType="number-pad" maxLength={4} />
          </View>
        </View>

        <TextField label={t.eventForm.venue} value={venueValue} onChangeText={setVenue} maxLength={80} />
        <TextField label={t.eventForm.address} value={addressValue} onChangeText={setAddress} maxLength={120} />

        <View style={styles.row}>
          <View style={styles.col}>
            <TextField
              label={t.eventForm.price}
              value={priceValue}
              onChangeText={setPrice}
              keyboardType="number-pad"
              editable={canCharge}
              maxLength={7}
            />
          </View>
          <View style={styles.col}>
            <TextField label={t.eventForm.capacity} value={capacity} onChangeText={setCapacity} keyboardType="number-pad" maxLength={4} />
          </View>
        </View>
        {!canCharge ? (
          <View style={[styles.note, { backgroundColor: colors.surfaceAlt }]}>
            <Icon icon={Info} size={16} color="textMuted" />
            <Text variant="caption" color="textMuted" style={{ flex: 1 }}>{t.eventForm.paidLocked}</Text>
          </View>
        ) : null}

        {passAllowed ? (
          <View style={[styles.switchRow, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="bodyStrong">{t.eventForm.includeInPass}</Text>
              <Text variant="caption" color="textMuted">{t.eventForm.includeInPassHint}</Text>
            </View>
            <Switch value={inPass} onValueChange={setInPass} trackColor={{ true: colors.accent, false: colors.surfaceAlt }} thumbColor={colors.surface} />
          </View>
        ) : null}

        {isOrg ? (
          <View style={[styles.fee, { borderColor: colors.line }]}>
            <View style={styles.feeRow}>
              <Text variant="bodyStrong">{t.eventForm.listingFee}</Text>
              <Text variant="bodyStrong">{formatKzt(LISTING_FEE_KZT)}</Text>
            </View>
            <Text variant="caption" color="textMuted">{t.eventForm.listingFeeHint}</Text>
          </View>
        ) : null}

        {create.error ? <Text variant="caption" color="danger">{errorMessage(create.error, t)}</Text> : null}
        <Button title={isOrg ? t.eventForm.publishAndPay : t.eventForm.publish} disabled={!valid} loading={create.isPending} onPress={submit} />
      </View>

      {unpaidId ? (
        <PaymentSheet
          amountKzt={LISTING_FEE_KZT}
          purpose="listing"
          pay={(payment) => payListing.mutateAsync({ eventId: unpaidId, payment })}
          // Оплатил или закрыл окно — переходим на встречу: без оплаты там будет кнопка «Оплатить размещение».
          onClose={() => router.replace({ pathname: '/event/[id]', params: { id: unpaidId } })}
        />
      ) : null}

      <Sheet visible={hostOpen} onClose={() => setHostOpen(false)} title={t.eventForm.host}>
        {hosts.map((h) => (
          <SheetOption
            key={`${h.type}:${h.id}`}
            icon={h.type === 'community' ? Users : Store}
            label={h.name}
            hint={h.verified ? t.common.verified : undefined}
            active={h === host}
            onPress={() => {
              setHostKey(`${h.type}:${h.id}`);
              setHostOpen(false);
            }}
          />
        ))}
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.xl, paddingTop: spacing.lg },
  block: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.md },
  col: { flex: 1 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: radius.md, borderWidth: 1 },
  fee: { padding: spacing.lg, borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed', gap: spacing.xs },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  note: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, marginTop: -spacing.md },
});
