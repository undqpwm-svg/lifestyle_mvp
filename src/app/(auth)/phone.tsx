import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { errorMessage } from '@/lib/errors';
import { formatPhoneInput, isValidKzMobile, phoneDigits, toE164 } from '@/lib/phone';
import { useAppSettings } from '@/state/app-settings';
import { spacing } from '@/theme/tokens';

export default function PhoneScreen() {
  const { t } = useAppSettings();
  const { requestCode } = useAuth();
  const [digits, setDigits] = useState('');
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const valid = isValidKzMobile(digits);

  const submit = async () => {
    setTouched(true);
    if (!valid) return;
    setLoading(true);
    setError(null);
    try {
      const phone = toE164(digits);
      await requestCode(phone);
      router.push({ pathname: '/code', params: { phone } });
    } catch (e) {
      setError(errorMessage(e, t));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen edges={['bottom']}>
      <View style={styles.body}>
        <Text variant="h1">{t.auth.phoneTitle}</Text>
        <Text color="textMuted">{t.auth.phoneHint}</Text>
        <TextField
          autoFocus
          prefix="+7"
          value={formatPhoneInput(digits)}
          onChangeText={(v) => setDigits(phoneDigits(v))}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
          placeholder="7XX XXX XX XX"
          onSubmitEditing={submit}
          error={error ?? (touched && !valid ? t.auth.phoneInvalid : null)}
        />
      </View>
      <Button title={t.auth.getCode} loading={loading} disabled={digits.length < 10} onPress={submit} />
    </Screen>
  );
}

const styles = StyleSheet.create({ body: { flex: 1, gap: spacing.lg, paddingTop: spacing.lg } });
