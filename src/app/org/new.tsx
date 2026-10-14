import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ORG_TYPES } from '@/api/interests';
import { useCreateOrganization } from '@/api/queries';
import type { OrgType } from '@/api/types';
import { useMe } from '@/auth/auth-context';
import { CityPicker } from '@/components/city-picker';
import { ORG_TYPE_ICONS } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import type { CityId } from '@/config/cities';
import { errorMessage } from '@/lib/errors';
import { useAppSettings } from '@/state/app-settings';
import { spacing } from '@/theme/tokens';

export default function NewOrganizationScreen() {
  const me = useMe();
  const { t, lang } = useAppSettings();
  const create = useCreateOrganization();
  const [type, setType] = useState<OrgType>('cafe');
  const [name, setName] = useState('');
  const [bin, setBin] = useState('');
  const [cityId, setCityId] = useState<CityId>(me.cityId);
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const binValid = /^\d{12}$/.test(bin);
  const valid = name.trim().length >= 2 && binValid && address.trim().length > 3;

  return (
    <Screen edges={['bottom']}>
      <View style={styles.form}>
        <View style={styles.block}>
          <Text variant="caption" color="textMuted">{t.orgForm.type}</Text>
          <View style={styles.chips}>
            {ORG_TYPES.map((o) => (
              <Chip key={o.id} icon={ORG_TYPE_ICONS[o.id]} label={o.name[lang]} active={type === o.id} onPress={() => setType(o.id)} />
            ))}
          </View>
        </View>
        <TextField label={t.orgForm.name} placeholder={t.orgForm.namePlaceholder} value={name} onChangeText={setName} maxLength={60} />
        <TextField
          label={t.orgForm.bin}
          value={bin}
          onChangeText={(v) => setBin(v.replace(/\D/g, '').slice(0, 12))}
          keyboardType="number-pad"
          hint={t.orgForm.binHint}
          error={bin.length > 0 && bin.length === 12 && !binValid ? t.orgForm.binInvalid : null}
        />
        <View style={styles.block}>
          <Text variant="caption" color="textMuted">{t.orgForm.city}</Text>
          <CityPicker value={cityId} onChange={setCityId} />
        </View>
        <TextField label={t.orgForm.address} value={address} onChangeText={setAddress} maxLength={120} />
        <TextField label={t.orgForm.description} value={description} onChangeText={setDescription} multiline maxLength={1000} />
        {create.error ? <Text variant="caption" color="danger">{errorMessage(create.error, t)}</Text> : null}
        <Button
          title={t.orgForm.submit}
          disabled={!valid}
          loading={create.isPending}
          onPress={() =>
            create.mutate(
              { type, name, bin, cityId, address: address.trim(), description: description.trim() },
              { onSuccess: (o) => router.replace({ pathname: '/org/[id]', params: { id: o.id } }) },
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
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
