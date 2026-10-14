import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useCreateCommunity } from '@/api/queries';
import type { InterestId } from '@/api/types';
import { useMe } from '@/auth/auth-context';
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

export default function NewCommunityScreen() {
  const me = useMe();
  const { t, cityId: feedCity } = useAppSettings();
  const create = useCreateCommunity();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cityId, setCityId] = useState<CityId>(feedCity ?? me.cityId);
  const [interests, setInterests] = useState<InterestId[]>([]);
  const valid = name.trim().length >= 3 && interests.length > 0;

  return (
    <Screen edges={['bottom']}>
      <View style={styles.form}>
        <TextField label={t.communityForm.name} placeholder={t.communityForm.namePlaceholder} value={name} onChangeText={setName} maxLength={60} />
        <TextField label={t.communityForm.description} value={description} onChangeText={setDescription} multiline maxLength={1000} />
        <View style={styles.block}>
          <Text variant="caption" color="textMuted">{t.orgForm.city}</Text>
          <CityPicker value={cityId} onChange={setCityId} />
        </View>
        <View style={styles.block}>
          <Text variant="caption" color="textMuted">{t.communityForm.interests}</Text>
          <InterestPicker multiple value={interests} onChange={setInterests} />
        </View>
        {create.error ? <Text variant="caption" color="danger">{errorMessage(create.error, t)}</Text> : null}
        <Button
          title={t.communityForm.create}
          disabled={!valid}
          loading={create.isPending}
          onPress={() =>
            create.mutate(
              { name, description, cityId, interests },
              { onSuccess: (c) => router.replace({ pathname: '/community/[id]', params: { id: c.id } }) },
            )
          }
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.xl, paddingTop: spacing.lg },
  block: { gap: spacing.sm },
});
