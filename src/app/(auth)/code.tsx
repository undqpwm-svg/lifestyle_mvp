import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { isMockApi } from '@/api/client';
import { useAuth } from '@/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { errorMessage } from '@/lib/errors';
import { maskPhone } from '@/lib/phone';
import { useAppSettings } from '@/state/app-settings';
import { spacing } from '@/theme/tokens';

const CODE_LENGTH = 4;
const RESEND_SEC = 60;

export default function CodeScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { t } = useAppSettings();
  const { verifyCode, requestCode } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [left, setLeft] = useState(RESEND_SEC);

  useEffect(() => {
    if (left <= 0) return;
    const id = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);

  // После успешной проверки навигацию делает Stack.Protected в корневом layout.
  const submit = async (value: string) => {
    setLoading(true);
    setError(null);
    try {
      await verifyCode(phone, value);
    } catch (e) {
      setError(errorMessage(e, t));
      setCode('');
      setLoading(false);
    }
  };

  const onChange = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, CODE_LENGTH);
    setCode(digits);
    if (digits.length === CODE_LENGTH) submit(digits);
  };

  return (
    <Screen edges={['bottom']}>
      <View style={styles.body}>
        <Text variant="h1">{t.auth.codeTitle}</Text>
        <Text color="textMuted">
          {t.auth.codeHint} {maskPhone(phone)}
        </Text>
        <TextField
          autoFocus
          value={code}
          onChangeText={onChange}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          maxLength={CODE_LENGTH}
          editable={!loading}
          placeholder="••••"
          style={styles.code}
          error={error}
          hint={isMockApi ? t.auth.codeMockHint : undefined}
        />
      </View>
      <Button
        variant="ghost"
        title={left > 0 ? `${t.auth.resendIn} 0:${String(left).padStart(2, '0')}` : t.auth.resend}
        disabled={left > 0}
        onPress={() => {
          setLeft(RESEND_SEC);
          requestCode(phone).catch((e) => setError(errorMessage(e, t)));
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, gap: spacing.lg, paddingTop: spacing.lg },
  code: { fontSize: 28, letterSpacing: 12, textAlign: 'center' },
});
