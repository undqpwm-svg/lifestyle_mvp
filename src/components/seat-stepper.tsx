import { Minus, Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { Icon } from './ui/icon';
import { Text } from './ui/text';

export function SeatStepper({ value, max, onChange }: { value: number; max: number; onChange: (v: number) => void }) {
  const { colors } = useTheme();
  const btn = (icon: typeof Plus, next: number, disabled: boolean, label: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={() => onChange(next)}
      style={[styles.btn, { borderColor: colors.line, opacity: disabled ? 0.35 : 1 }]}>
      <Icon icon={icon} size={18} />
    </Pressable>
  );
  return (
    <View style={styles.row}>
      {btn(Minus, value - 1, value <= 1, 'minus seat')}
      <Text variant="h3" style={styles.value}>
        {value}
      </Text>
      {btn(Plus, value + 1, value >= max, 'plus seat')}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  btn: { width: 40, height: 40, borderRadius: radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  value: { minWidth: 24, textAlign: 'center', fontVariant: ['tabular-nums'] },
});
