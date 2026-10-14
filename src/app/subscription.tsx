import { CircleCheck, Crown } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useCancelSubscription, useEvents, useMySubscription, useSubscribe } from '@/api/queries';
import { EventCard } from '@/components/event-card';
import { PaymentSheet } from '@/components/payment/payment-sheet';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { Section } from '@/components/ui/section';
import { LoadingView } from '@/components/ui/state-view';
import { Text } from '@/components/ui/text';
import { PASS_PLAN } from '@/config/billing';
import { fill, formatDate, formatKzt } from '@/lib/format';
import { useAppSettings } from '@/state/app-settings';
import { palette, radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

export default function SubscriptionScreen() {
  const { colors } = useTheme();
  const { t, lang, cityId } = useAppSettings();
  const sub = useMySubscription();
  const subscribe = useSubscribe();
  const cancel = useCancelSubscription();
  const events = useEvents({ cityId });
  const [paying, setPaying] = useState(false);

  const s = sub.data;
  const live = s && s.status !== 'expired';
  const included = (events.data ?? []).filter((e) => e.includedInSubscription);
  const price = formatKzt(PASS_PLAN.priceKzt);

  return (
    <Screen edges={['bottom']}>
      <View style={[styles.hero, { backgroundColor: palette.ink }]}>
        <View style={[styles.crown, { backgroundColor: palette.yellow }]}>
          <Icon icon={Crown} size={24} tint={palette.ink} />
        </View>
        <Text variant="h2" style={{ color: palette.cream }}>
          {t.pass.name}
        </Text>
        <View style={styles.priceRow}>
          <Text variant="h1" style={{ color: palette.yellow }}>
            {price}
          </Text>
          <Text style={{ color: palette.cream, opacity: 0.6 }}>{t.pass.perMonth}</Text>
        </View>
        <Text style={{ color: palette.cream, opacity: 0.75 }}>{t.pass.tagline}</Text>
      </View>

      {sub.isPending ? (
        <LoadingView />
      ) : live ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <View style={styles.statusRow}>
            <Icon icon={CircleCheck} size={20} color={s.status === 'active' ? 'success' : 'textMuted'} />
            <Text variant="bodyStrong" style={{ flex: 1 }}>
              {s.status === 'active' ? t.pass.active : t.pass.cancelled}
            </Text>
            <Text color="textMuted">{fill(t.pass.until, { date: formatDate(s.endsAt, lang) })}</Text>
          </View>
          <View style={styles.visitsRow}>
            <Text variant="caption" color="textMuted">
              {t.pass.visits}
            </Text>
            <Text variant="caption">
              {s.visitsUsed}/{s.visitsLimit}
            </Text>
          </View>
          <View style={[styles.track, { backgroundColor: colors.surfaceAlt }]}>
            <View style={[styles.bar, { width: `${Math.min(1, s.visitsUsed / s.visitsLimit) * 100}%`, backgroundColor: colors.inverse }]} />
          </View>
          {s.status === 'active' ? (
            <Button title={t.pass.cancel} variant="ghost" loading={cancel.isPending} onPress={() => cancel.mutate()} />
          ) : null}
        </View>
      ) : (
        <View style={styles.perks}>
          {[t.pass.perkFree, fill(t.pass.perkVisits, { n: PASS_PLAN.visitsLimit }), t.pass.perkCancel].map((p) => (
            <View key={p} style={styles.perk}>
              <Icon icon={CircleCheck} size={20} color="success" />
              <Text style={{ flex: 1 }}>{p}</Text>
            </View>
          ))}
          <Button title={fill(s?.status === 'expired' ? t.pass.renew : t.pass.subscribe, { price })} onPress={() => setPaying(true)} />
        </View>
      )}

      {included.length > 0 ? (
        <Section title={t.event.passBadge}>
          {included.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </Section>
      ) : null}

      {paying ? (
        <PaymentSheet
          amountKzt={PASS_PLAN.priceKzt}
          purpose="subscription"
          pay={(p) => subscribe.mutateAsync(p)}
          onClose={() => setPaying(false)}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: radius.lg, padding: spacing.xl, gap: spacing.sm, marginTop: spacing.lg, marginBottom: spacing.xl },
  crown: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  card: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg, gap: spacing.md, marginBottom: spacing.xl },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  visitsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  track: { height: 8, borderRadius: radius.pill, overflow: 'hidden' },
  bar: { height: '100%', borderRadius: radius.pill },
  perks: { gap: spacing.lg, marginBottom: spacing.xl },
  perk: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
