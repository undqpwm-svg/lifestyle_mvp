import { router, useLocalSearchParams } from 'expo-router';
import { ChevronRight, Download, QrCode } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { api } from '@/api/client';
import { useOrganization, useOrgStats } from '@/api/queries';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { Section } from '@/components/ui/section';
import { EmptyView, LoadingView } from '@/components/ui/state-view';
import { Text } from '@/components/ui/text';
import { PASS_PAYOUT_SHARE } from '@/config/billing';
import { toCsv } from '@/lib/csv';
import { errorMessage } from '@/lib/errors';
import { exportCsv } from '@/lib/export';
import { fill, formatEventDate, formatKzt } from '@/lib/format';
import { useAppSettings } from '@/state/app-settings';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

// Кабинет организации: сводка продаж, чек-инов и выплат, выгрузка участников для Excel/1С.
export default function DashboardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { t, lang } = useAppSettings();
  const org = useOrganization(id);
  const stats = useOrgStats(id);
  const [exportState, setExportState] = useState<{ busy: boolean; note: string | null }>({ busy: false, note: null });

  const exportParticipants = async () => {
    if (!stats.data) return;
    setExportState({ busy: true, note: null });
    try {
      const rows: (string | number)[][] = [];
      for (const e of stats.data.events) {
        const list = await api.listParticipants(e.id);
        for (const p of list) {
          rows.push([
            e.title,
            new Date(e.startsAt).toLocaleString('ru-RU'),
            p.name,
            p.phoneMasked,
            p.seats,
            p.status,
            p.viaSubscription ? 'подписка' : 'оплата',
            p.paidKzt,
            p.checkedInAt ? new Date(p.checkedInAt).toLocaleString('ru-RU') : '',
          ]);
        }
      }
      const csv = toCsv(['Встреча', 'Дата', 'Участник', 'Телефон', 'Мест', 'Статус', 'Тип', 'Оплачено, ₸', 'Чек-ин'], rows);
      await exportCsv(`lifestyle-participants-${new Date().toISOString().slice(0, 10)}.csv`, csv);
      setExportState({ busy: false, note: t.dashboard.exported });
    } catch (e) {
      setExportState({ busy: false, note: errorMessage(e, t) });
    }
  };

  if (stats.isPending) return <Screen edges={['bottom']}><LoadingView /></Screen>;
  if (stats.isError || !stats.data) return <Screen edges={['bottom']}><EmptyView title={errorMessage(stats.error, t)} /></Screen>;
  const s = stats.data.totals;

  const tiles = [
    { label: t.dashboard.seats, value: String(s.seats) },
    { label: t.dashboard.checkedIn, value: String(s.checkedIn) },
    { label: t.dashboard.revenue, value: formatKzt(s.revenueKzt) },
    { label: t.dashboard.passVisits, value: String(s.passVisits) },
  ];

  return (
    <Screen edges={['bottom']}>
      <Text variant="h2" style={styles.title}>
        {org.data?.name}
      </Text>

      <View style={[styles.payout, { backgroundColor: colors.inverse }]}>
        <Text variant="caption" color="onInverse" style={{ opacity: 0.7 }}>
          {t.dashboard.payout}
        </Text>
        <Text variant="h1" style={{ color: colors.accent }}>
          {formatKzt(s.payoutKzt)}
        </Text>
        <Text variant="caption" color="onInverse" style={{ opacity: 0.7 }}>
          {fill(t.dashboard.payoutHint, { share: Math.round(PASS_PAYOUT_SHARE * 100) })}
        </Text>
      </View>

      <View style={styles.grid}>
        {tiles.map((tile) => (
          <View key={tile.label} style={[styles.tile, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <Text variant="caption" color="textMuted">
              {tile.label}
            </Text>
            <Text variant="h3" style={styles.num}>
              {tile.value}
            </Text>
          </View>
        ))}
      </View>

      <Button title={t.dashboard.export} icon={Download} variant="ghost" loading={exportState.busy} onPress={exportParticipants} />
      <Text variant="caption" color="textMuted" style={styles.center}>
        {exportState.note ?? t.dashboard.exportHint}
      </Text>

      <Section title={t.dashboard.events}>
        {stats.data.events.length === 0 ? (
          <Text color="textMuted">{t.dashboard.noEvents}</Text>
        ) : (
          stats.data.events.map((e) => (
            <View key={e.id} style={[styles.event, { backgroundColor: colors.surface, borderColor: colors.line }]}>
              <Pressable style={styles.eventHead} onPress={() => router.push({ pathname: '/event/[id]', params: { id: e.id } })}>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong" numberOfLines={1}>
                    {e.title}
                  </Text>
                  <Text variant="caption" color="textMuted">
                    {formatEventDate(e.startsAt, lang, t)}
                    {e.status === 'awaiting_payment' ? ` · ${t.dashboard.unpaid}` : ''}
                  </Text>
                </View>
                <Icon icon={ChevronRight} size={18} color="textFaint" />
              </Pressable>
              <View style={styles.eventStats}>
                <Stat label={t.dashboard.seats} value={`${e.seats}/${e.capacity}`} />
                <Stat label={t.dashboard.checkedIn} value={String(e.checkedIn)} />
                <Stat label={t.dashboard.payout} value={formatKzt(e.payoutKzt)} />
              </View>
              {e.status === 'published' ? (
                <Button
                  title={t.event.checkin}
                  icon={QrCode}
                  variant="ghost"
                  onPress={() => router.push({ pathname: '/event/[id]/checkin', params: { id: e.id } })}
                />
              ) : null}
            </View>
          ))
        )}
      </Section>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Text variant="label" color="textMuted">
        {label}
      </Text>
      <Text variant="bodyStrong" style={styles.num}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { paddingTop: spacing.lg, paddingBottom: spacing.lg },
  payout: { padding: spacing.xl, borderRadius: radius.lg, gap: 4, marginBottom: spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.lg },
  tile: { flexBasis: '47%', flexGrow: 1, padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, gap: 4 },
  num: { fontVariant: ['tabular-nums'] },
  center: { textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.xl },
  event: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg, gap: spacing.md },
  eventHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  eventStats: { flexDirection: 'row', gap: spacing.md },
});
