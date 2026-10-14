import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { InterestId } from '@/api/types';
import { useAuth } from '@/auth/auth-context';
import { CityPicker } from '@/components/city-picker';
import { InterestPicker } from '@/components/interest-picker';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import type { CityId } from '@/config/cities';
import { errorMessage } from '@/lib/errors';
import { useAppSettings } from '@/state/app-settings';
import { spacing } from '@/theme/tokens';

export default function OnboardingScreen() {
  const { t, cityId: feedCity, setCity } = useAppSettings();
  const { user, completeProfile } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [cityId, setCityId] = useState<CityId>(user?.cityId ?? feedCity);
  const [interests, setInterests] = useState<InterestId[]>(user?.interests ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const valid = name.trim().length >= 2 && interests.length > 0;

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      await completeProfile({ name: name.trim(), cityId, interests });
      setCity(cityId); // лента по умолчанию — город из профиля
    } catch (e) {
      setError(errorMessage(e, t));
      setLoading(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.body}>
        <Text variant="h1">{t.onboarding.title}</Text>
        <TextField
          label={t.onboarding.name}
          placeholder={t.onboarding.namePlaceholder}
          value={name}
          onChangeText={setName}
          autoComplete="name"
          textContentType="name"
          maxLength={40}
        />
        <View style={styles.block}>
          <Text variant="caption" color="textMuted">
            {t.onboarding.city}
          </Text>
          <CityPicker value={cityId} onChange={setCityId} />
        </View>
        <View style={styles.block}>
          <Text variant="caption" color="textMuted">
            {t.onboarding.interests}
          </Text>
          <Text variant="caption" color="textFaint">
            {t.onboarding.interestsHint}
          </Text>
          <InterestPicker multiple value={interests} onChange={setInterests} />
        </View>
        {error ? (
          <Text variant="caption" color="danger">
            {error}
          </Text>
        ) : null}
      </View>
      <Button title={t.onboarding.finish} disabled={!valid} loading={loading} onPress={submit} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, gap: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.xl },
  block: { gap: spacing.sm },
});
