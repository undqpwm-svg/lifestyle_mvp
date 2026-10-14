import { StyleSheet, View } from 'react-native';

import { INTERESTS } from '@/api/interests';
import type { InterestId } from '@/api/types';
import { useAppSettings } from '@/state/app-settings';
import { spacing } from '@/theme/tokens';

import { Chip } from './ui/chip';

type Props =
  | { multiple: true; value: InterestId[]; onChange: (v: InterestId[]) => void }
  | { multiple?: false; value: InterestId | null; onChange: (v: InterestId) => void };

export function InterestPicker(props: Props) {
  const { lang } = useAppSettings();
  const isActive = (id: InterestId) => (props.multiple ? props.value.includes(id) : props.value === id);
  const toggle = (id: InterestId) => {
    if (props.multiple) {
      props.onChange(isActive(id) ? props.value.filter((x) => x !== id) : [...props.value, id]);
    } else {
      props.onChange(id);
    }
  };
  return (
    <View style={styles.wrap}>
      {INTERESTS.map((i) => (
        <Chip key={i.id} label={`${i.emoji} ${i.name[lang]}`} active={isActive(i.id)} onPress={() => toggle(i.id)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({ wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm } });
