import { useLocalSearchParams } from 'expo-router';
import { CircleCheck } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { useBooking } from '@/api/queries';
import { HostLabel } from '@/components/host-label';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { EmptyView, LoadingView } from '@/components/ui/state-view';
import { Text } from '@/components/ui/text';
import { fill, formatEventDate } from '@/lib/format';
import { useAppSettings } from '@/state/app-settings';
import { palette, radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

// Электронный билет: QR для сканера организатора + код для ручного ввода.
export default function TicketScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { colors } = useTheme();
  const { t, lang } = useAppSettings();
  const { data: b, isPending } = useBooking(bookingId);

  if (isPending) return <Screen edges={['bottom']}><LoadingView /></Screen>;
  if (!b) return <Screen edges={['bottom']}><EmptyView title={t.ticket.notFound} /></Screen>;

  return (
    <Screen edges={['bottom']}>
      <View style={[styles.ticket, { backgroundColor: colors.surface, borderColor: colors.line }]}>
        <Text variant="h2" style={styles.center}>
          {b.event.title}
        </Text>
        <Text color="textMuted" style={styles.center}>
          {formatEventDate(b.event.startsAt, lang, t)} · {b.event.venue}
        </Text>
        <HostLabel host={b.event.host} />

        {/* QR всегда чёрный на белом — так его читает любой сканер, в том числе в тёмной теме */}
        <View style={styles.qr}>
          <QRCode value={`LS:${b.id}:${b.code}`} size={220} color={palette.ink} backgroundColor="#FFFFFF" />
        </View>

        <Text variant="caption" color="textMuted">
          {t.ticket.code}
        </Text>
        <Text style={styles.code}>{b.code}</Text>
        {b.seats > 1 ? <Text variant="bodyStrong">{fill(t.ticket.seats, { n: b.seats })}</Text> : null}

        {b.checkedInAt ? (
          <View style={[styles.done, { backgroundColor: colors.accentSoft }]}>
            <Icon icon={CircleCheck} size={18} color="success" />
            <Text variant="bodyStrong">{t.ticket.checkedIn}</Text>
          </View>
        ) : (
          <Text variant="caption" color="textMuted" style={styles.center}>
            {t.ticket.show}
          </Text>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  ticket: { marginTop: spacing.xl, padding: spacing.xl, borderRadius: radius.lg, borderWidth: 1, alignItems: 'center', gap: spacing.md },
  center: { textAlign: 'center' },
  qr: { padding: spacing.md, backgroundColor: '#FFFFFF', borderRadius: radius.md, marginVertical: spacing.md },
  code: { fontSize: 30, letterSpacing: 6, fontWeight: '700', fontVariant: ['tabular-nums'] },
  done: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md },
});
