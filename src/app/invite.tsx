import * as Clipboard from 'expo-clipboard';
import { Copy, Gift, Share2 } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable, Share, StyleSheet, View } from 'react-native';

import { useApplyReferral, useProfile } from '@/api/queries';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { LoadingView } from '@/components/ui/state-view';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { REFERRAL_BONUS_KZT } from '@/config/billing';
import { errorMessage } from '@/lib/errors';
import { fill, formatKzt } from '@/lib/format';
import { useAppSettings } from '@/state/app-settings';
import { palette, radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

export default function InviteScreen() {
  const { colors } = useTheme();
  const { t } = useAppSettings();
  const profile = useProfile();
  const apply = useApplyReferral();
  const [code, setCode] = useState('');
  const [note, setNote] = useState<string | null>(null);
  const me = profile.data;

  if (!me) return <Screen edges={['bottom']}><LoadingView /></Screen>;
  const amount = formatKzt(REFERRAL_BONUS_KZT);
  const message = fill(t.invite.message, { code: me.referralCode, amount });

  const copy = async () => {
    await Clipboard.setStringAsync(me.referralCode);
    setNote(t.invite.copied);
  };

  const share = async () => {
    // В браузере системного «Поделиться» может не быть — копируем текст приглашения.
    if (Platform.OS === 'web' && !('share' in navigator)) {
      await Clipboard.setStringAsync(message);
      return setNote(t.invite.copied);
    }
    await Share.share({ message }).catch(() => {});
  };

  return (
    <Screen edges={['bottom']}>
      <View style={[styles.hero, { backgroundColor: palette.yellow }]}>
        <Icon icon={Gift} size={32} tint={palette.ink} />
        <Text variant="h2" style={{ color: palette.ink }}>
          {fill(t.invite.title, {})}
        </Text>
        <Text style={{ color: palette.ink, opacity: 0.75 }}>{fill(t.invite.text, { amount })}</Text>
      </View>

      <Text variant="caption" color="textMuted">
        {t.invite.yourCode}
      </Text>
      <Pressable onPress={copy} style={[styles.code, { borderColor: colors.inverse }]}>
        <Text style={styles.codeText}>{me.referralCode}</Text>
        <Icon icon={Copy} size={20} />
      </Pressable>
      {note ? (
        <Text variant="caption" color="textMuted" style={styles.center}>
          {note}
        </Text>
      ) : null}
      <Button title={t.invite.share} icon={Share2} onPress={share} />

      <View style={[styles.balance, { backgroundColor: colors.surface, borderColor: colors.line }]}>
        <Text color="textMuted">{t.invite.balance}</Text>
        <Text variant="h3">{formatKzt(me.bonusKzt)}</Text>
      </View>

      <View style={styles.apply}>
        <Text variant="h3">{t.invite.haveCode}</Text>
        <View style={styles.applyRow}>
          <View style={{ flex: 1 }}>
            <TextField value={code} onChangeText={(v) => setCode(v.toUpperCase())} autoCapitalize="characters" placeholder="AMAN" />
          </View>
          <Button
            title={t.invite.apply}
            variant="dark"
            disabled={!code.trim()}
            loading={apply.isPending}
            onPress={() => apply.mutate(code, { onSuccess: () => setNote(t.invite.applied) })}
            style={{ minHeight: 52 }}
          />
        </View>
        {apply.error ? <Text variant="caption" color="danger">{errorMessage(apply.error, t)}</Text> : null}
        {apply.isSuccess ? <Text variant="caption" color="success">{t.invite.applied}</Text> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { padding: spacing.xl, borderRadius: radius.lg, gap: spacing.sm, marginTop: spacing.lg, marginBottom: spacing.xl },
  code: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 2, borderStyle: 'dashed', borderRadius: radius.md, padding: spacing.lg, marginTop: spacing.sm, marginBottom: spacing.md },
  codeText: { fontSize: 26, fontWeight: '800', letterSpacing: 4 },
  center: { textAlign: 'center', marginBottom: spacing.sm },
  balance: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, marginVertical: spacing.xl },
  apply: { gap: spacing.md },
  applyRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end' },
});
