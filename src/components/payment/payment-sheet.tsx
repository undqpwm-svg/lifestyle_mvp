import { ChevronRight, CircleCheck, CreditCard, Lock, ShieldCheck, Smartphone, X } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useProfile } from '@/api/queries';
import type { PaymentInput, PaymentPurpose } from '@/api/types';
import { BONUS_MAX_SHARE } from '@/config/billing';
import { cardBrand, cardDigits, formatCardNumber, formatExpiry, luhnValid, parseExpiry } from '@/lib/card';
import { errorMessage } from '@/lib/errors';
import { fill, formatKzt } from '@/lib/format';
import { useAppSettings } from '@/state/app-settings';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { Button } from '../ui/button';
import { Icon, type LucideIcon } from '../ui/icon';
import { Text } from '../ui/text';
import { TextField } from '../ui/text-field';

type Step = 'method' | 'card' | 'kaspi' | 'processing' | 'success';

type Props = {
  amountKzt: number;
  purpose: PaymentPurpose;
  /** Проводит платёж; ошибка ApiError показывается в окне */
  pay: (payment: PaymentInput) => Promise<unknown>;
  onClose: () => void;
  onPaid?: () => void;
};

// Окно оплаты: Kaspi или банковская карта. Монтируется только на время оплаты, поэтому состояние всегда свежее.
export function PaymentSheet({ amountKzt, purpose, pay, onClose, onPaid }: Props) {
  const { colors } = useTheme();
  const { t } = useAppSettings();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>('method');
  const [error, setError] = useState<string | null>(null);
  const [number, setNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [touched, setTouched] = useState(false);
  const [useBonus, setUseBonus] = useState(false);
  const profile = useProfile();
  // Бонусами можно оплатить не больше половины суммы — так же считает сервер.
  const bonusAvailable = Math.min(profile.data?.bonusKzt ?? 0, Math.floor(amountKzt * BONUS_MAX_SHARE));
  const bonus = useBonus ? bonusAvailable : 0;
  const toPay = amountKzt - bonus;

  const exp = parseExpiry(expiry);
  const numberOk = luhnValid(number);
  const cvcOk = /^\d{3}$/.test(cvc);
  const brand = cardBrand(number);

  const run = async (payment: PaymentInput, back: Step) => {
    setError(null);
    setStep('processing');
    try {
      await pay({ ...payment, useBonus: bonus > 0 });
      setStep('success');
    } catch (e) {
      setError(errorMessage(e, t));
      setStep(back);
    }
  };

  const payByCard = () => {
    setTouched(true);
    if (!numberOk || !exp || !cvcOk) return;
    run({ method: 'card', card: { number, expMonth: exp.month, expYear: exp.year, cvc } }, 'card');
  };

  const finish = () => {
    onPaid?.();
    onClose();
  };

  const busy = step === 'processing';

  return (
    <Modal visible transparent animationType="slide" onRequestClose={busy ? undefined : step === 'success' ? finish : onClose}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={StyleSheet.absoluteFill} onPress={busy ? undefined : step === 'success' ? finish : onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: spacing.xl + insets.bottom }]}>
          <View style={styles.head}>
            <View style={{ flex: 1 }}>
              <Text variant="caption" color="textMuted">
                {t.payment.purpose[purpose]}
              </Text>
              <Text variant="h2">{formatKzt(toPay)}</Text>
              {bonus > 0 ? (
                <Text variant="caption" color="textMuted" style={styles.strike}>
                  {formatKzt(amountKzt)}
                </Text>
              ) : null}
            </View>
            {!busy ? (
              <Pressable accessibilityLabel={t.common.close} hitSlop={10} onPress={step === 'success' ? finish : onClose} style={[styles.close, { backgroundColor: colors.surfaceAlt }]}>
                <Icon icon={X} size={18} />
              </Pressable>
            ) : null}
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body} bounces={false}>
            {error ? (
              <View style={[styles.error, { backgroundColor: colors.surfaceAlt }]}>
                <Text variant="caption" color="danger">
                  {error}
                </Text>
              </View>
            ) : null}

            {step === 'method' && bonusAvailable > 0 ? (
              <View style={[styles.bonus, { backgroundColor: colors.accentSoft }]}>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong">{t.payment.bonus}</Text>
                  <Text variant="caption" color="textMuted">
                    {fill(t.payment.bonusHint, { amount: formatKzt(bonusAvailable) })}
                  </Text>
                </View>
                <Switch value={useBonus} onValueChange={setUseBonus} trackColor={{ true: colors.inverse, false: colors.surfaceAlt }} thumbColor={colors.surface} />
              </View>
            ) : null}

            {step === 'method' ? (
              <>
                <MethodRow icon={Smartphone} title={t.payment.kaspi} hint={t.payment.kaspiHint} onPress={() => setStep('kaspi')} />
                <MethodRow icon={CreditCard} title={t.payment.card} hint={t.payment.cardHint} onPress={() => setStep('card')} />
                <SecureNote text={t.payment.secure} />
              </>
            ) : null}

            {step === 'card' ? (
              <>
                <TextField
                  label={t.payment.cardNumber}
                  icon={CreditCard}
                  value={formatCardNumber(number)}
                  onChangeText={(v) => setNumber(cardDigits(v))}
                  keyboardType="number-pad"
                  autoComplete="cc-number"
                  textContentType="creditCardNumber"
                  placeholder="0000 0000 0000 0000"
                  error={touched && !numberOk ? t.payment.invalidNumber : null}
                  autoFocus
                />
                {brand !== 'unknown' ? (
                  <Text variant="label" color="textMuted" style={styles.brand}>
                    {brand === 'visa' ? 'VISA' : 'MASTERCARD'}
                  </Text>
                ) : null}
                <View style={styles.row}>
                  <View style={styles.col}>
                    <TextField
                      label={t.payment.expiry}
                      value={expiry}
                      onChangeText={(v) => setExpiry(formatExpiry(v))}
                      keyboardType="number-pad"
                      autoComplete="cc-exp"
                      placeholder="ММ/ГГ"
                      maxLength={5}
                      error={touched && !exp ? t.payment.invalidExpiry : null}
                    />
                  </View>
                  <View style={styles.col}>
                    <TextField
                      label={t.payment.cvc}
                      icon={Lock}
                      value={cvc}
                      onChangeText={(v) => setCvc(v.replace(/\D/g, '').slice(0, 3))}
                      keyboardType="number-pad"
                      autoComplete="cc-csc"
                      secureTextEntry
                      placeholder="•••"
                      maxLength={3}
                      error={touched && !cvcOk ? t.payment.invalidCvc : null}
                    />
                  </View>
                </View>
                <Button title={`${t.payment.pay} ${formatKzt(toPay)}`} onPress={payByCard} />
                <Button title={t.payment.back} variant="ghost" onPress={() => setStep('method')} />
                <SecureNote text={t.payment.secure} />
                <Text variant="caption" color="textFaint" style={styles.center}>
                  {t.payment.testCard}
                </Text>
              </>
            ) : null}

            {step === 'kaspi' ? (
              <>
                {/* В продакшене: сервер создаёт платёж Kaspi Pay и отдаёт ссылку; клиент открывает её
                    через Linking.openURL и ждёт подтверждения по вебхуку. Здесь — имитация подтверждения. */}
                <View style={[styles.kaspi, { backgroundColor: colors.surface, borderColor: colors.line }]}>
                  <View style={[styles.kaspiIcon, { backgroundColor: colors.accent }]}>
                    <Icon icon={Smartphone} size={28} color="onAccent" />
                  </View>
                  <Text variant="h3" style={styles.center}>
                    {t.payment.kaspiTitle}
                  </Text>
                  <Text variant="caption" color="textMuted" style={styles.center}>
                    {t.payment.kaspiText}
                  </Text>
                </View>
                <Button title={t.payment.kaspiConfirm} variant="dark" onPress={() => run({ method: 'kaspi' }, 'kaspi')} />
                <Button title={t.payment.back} variant="ghost" onPress={() => setStep('method')} />
              </>
            ) : null}

            {step === 'processing' ? (
              <View style={styles.status}>
                <ActivityIndicator color={colors.text} size="large" />
                <Text color="textMuted">{t.payment.processing}</Text>
              </View>
            ) : null}

            {step === 'success' ? (
              <View style={styles.status}>
                <Icon icon={CircleCheck} size={56} color="success" strokeWidth={1.6} />
                <Text variant="h2">{t.payment.success}</Text>
                <Button title={t.payment.done} style={styles.stretch} onPress={finish} />
              </View>
            ) : null}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function MethodRow({ icon, title, hint, onPress }: { icon: LucideIcon; title: string; hint: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.method, { backgroundColor: colors.surface, borderColor: colors.line, opacity: pressed ? 0.85 : 1 }]}>
      <View style={[styles.methodIcon, { backgroundColor: colors.surfaceAlt }]}>
        <Icon icon={icon} size={22} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong">{title}</Text>
        <Text variant="caption" color="textMuted">
          {hint}
        </Text>
      </View>
      <Icon icon={ChevronRight} size={18} color="textFaint" />
    </Pressable>
  );
}

function SecureNote({ text }: { text: string }) {
  return (
    <View style={styles.secure}>
      <Icon icon={ShieldCheck} size={16} color="textMuted" />
      <Text variant="caption" color="textMuted" style={{ flex: 1 }}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: spacing.xl,
    width: '100%',
    maxWidth: 640,
    maxHeight: '92%',
    alignSelf: 'center',
  },
  head: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: spacing.xl, marginBottom: spacing.lg },
  close: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: spacing.xl, gap: spacing.md },
  error: { padding: spacing.md, borderRadius: radius.md },
  bonus: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: radius.md },
  strike: { textDecorationLine: 'line-through' },
  method: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: radius.md, borderWidth: 1 },
  methodIcon: { width: 44, height: 44, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  secure: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', paddingTop: spacing.sm },
  brand: { alignSelf: 'flex-end', marginTop: -spacing.sm },
  row: { flexDirection: 'row', gap: spacing.md },
  col: { flex: 1 },
  center: { textAlign: 'center' },
  kaspi: { alignItems: 'center', gap: spacing.md, padding: spacing.xl, borderRadius: radius.lg, borderWidth: 1 },
  kaspiIcon: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  status: { alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.xxl },
  stretch: { alignSelf: 'stretch' },
});
