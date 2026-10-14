import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams } from 'expo-router';
import { CircleCheck, Clock, Crown, QrCode, X } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCheckIn, useEvent, useParticipants } from '@/api/queries';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { EmptyView, LoadingView } from '@/components/ui/state-view';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { errorMessage } from '@/lib/errors';
import { fill } from '@/lib/format';
import { useAppSettings } from '@/state/app-settings';
import { palette, radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

// Чек-ин на входе: сканер QR-билетов (в приложении) или ручной ввод кода (везде, в том числе в вебе).
export default function CheckInScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { t } = useAppSettings();
  const event = useEvent(id);
  const participants = useParticipants(id);
  const checkIn = useCheckIn(id);
  const [code, setCode] = useState('');
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [scanning, setScanning] = useState(false);

  const submit = (value: string) => {
    if (!value.trim()) return;
    checkIn.mutate(value, {
      onSuccess: (p) => {
        setResult({ ok: true, text: fill(p.alreadyCheckedIn ? t.checkin.already : t.checkin.success, { name: p.name }) });
        setCode('');
      },
      onError: (e) => setResult({ ok: false, text: errorMessage(e, t) }),
    });
  };

  const list = participants.data ?? [];
  const confirmed = list.filter((p) => p.status === 'confirmed');
  const came = confirmed.filter((p) => p.checkedInAt).length;

  return (
    <Screen edges={['bottom']}>
      <View style={styles.body}>
        <Text variant="h2">{event.data?.title}</Text>

        {Platform.OS !== 'web' ? (
          <Button title={t.checkin.scan} icon={QrCode} onPress={() => setScanning(true)} />
        ) : (
          <Text variant="caption" color="textMuted">
            {t.checkin.cameraWeb}
          </Text>
        )}

        <View style={styles.manual}>
          <View style={{ flex: 1 }}>
            <TextField
              label={t.checkin.manual}
              placeholder={t.checkin.manualPlaceholder}
              value={code}
              onChangeText={(v) => setCode(v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
              autoCapitalize="characters"
              onSubmitEditing={() => submit(code)}
            />
          </View>
          <Button title={t.checkin.check} variant="dark" disabled={code.length < 6} loading={checkIn.isPending} onPress={() => submit(code)} style={styles.checkBtn} />
        </View>

        {result ? (
          <View style={[styles.result, { backgroundColor: result.ok ? colors.accentSoft : colors.surfaceAlt }]}>
            <Icon icon={result.ok ? CircleCheck : X} size={20} color={result.ok ? 'success' : 'danger'} />
            <Text variant="bodyStrong" style={{ flex: 1 }}>
              {result.text}
            </Text>
          </View>
        ) : null}

        <View style={styles.head}>
          <Text variant="h3">{t.checkin.participants}</Text>
          <Text color="textMuted">{fill(t.checkin.came, { n: came, total: confirmed.length })}</Text>
        </View>

        {participants.isPending ? (
          <LoadingView />
        ) : confirmed.length === 0 ? (
          <EmptyView title={t.checkin.noParticipants} />
        ) : (
          <View style={[styles.table, { borderColor: colors.line, backgroundColor: colors.surface }]}>
            {confirmed.map((p, i) => (
              <View key={p.bookingId} style={[styles.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line }]}>
                <Icon icon={p.checkedInAt ? CircleCheck : Clock} size={18} color={p.checkedInAt ? 'success' : 'textFaint'} />
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong">
                    {p.name}
                    {p.seats > 1 ? ` +${p.seats - 1}` : ''}
                  </Text>
                  <Text variant="caption" color="textMuted">
                    {p.phoneMasked}
                  </Text>
                </View>
                {p.viaSubscription ? (
                  <View style={styles.pass}>
                    <Icon icon={Crown} size={13} color="textMuted" />
                    <Text variant="label" color="textMuted">
                      {t.checkin.viaPass}
                    </Text>
                  </View>
                ) : null}
                {!p.checkedInAt ? (
                  <Text variant="label" color="textFaint">
                    {t.checkin.waiting}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        )}
      </View>

      {scanning ? (
        <Scanner
          onClose={() => setScanning(false)}
          onScan={(data) => {
            setScanning(false);
            submit(data);
          }}
        />
      ) : null}
    </Screen>
  );
}

function Scanner({ onScan, onClose }: { onScan: (data: string) => void; onClose: () => void }) {
  const { t } = useAppSettings();
  const insets = useSafeAreaInsets();
  const [permission, request] = useCameraPermissions();
  // Камера присылает один и тот же код много раз в секунду — берём первый.
  const handled = useRef(false);

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={styles.scanner}>
        {permission?.granted ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={({ data }) => {
              if (handled.current) return;
              handled.current = true;
              onScan(data);
            }}
          />
        ) : (
          <View style={styles.permission}>
            <Text style={{ color: palette.cream, textAlign: 'center' }}>{t.checkin.cameraDenied}</Text>
            <Button title={t.checkin.scan} onPress={request} />
          </View>
        )}
        <View style={styles.frame} pointerEvents="none" />
        <Pressable accessibilityLabel={t.common.close} onPress={onClose} style={[styles.close, { top: insets.top + spacing.md }]}>
          <Icon icon={X} size={24} tint={palette.cream} />
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.lg, paddingTop: spacing.lg },
  manual: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  checkBtn: { minHeight: 52 },
  result: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: radius.md },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: spacing.md },
  table: { borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  pass: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  scanner: { flex: 1, backgroundColor: '#000' },
  permission: { flex: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.lg },
  frame: {
    position: 'absolute',
    alignSelf: 'center',
    top: '30%',
    width: 240,
    height: 240,
    borderWidth: 3,
    borderColor: palette.yellow,
    borderRadius: radius.lg,
  },
  close: {
    position: 'absolute',
    right: spacing.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
