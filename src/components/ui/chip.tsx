import { Pressable, StyleSheet } from 'react-native';

import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { Icon, type LucideIcon } from './icon';
import { Text } from './text';

type Props = { label: string; icon?: LucideIcon; active?: boolean; onPress?: () => void };

export function Chip({ label, icon, active, onPress }: Props) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: active ? colors.inverse : colors.surface,
          borderColor: active ? colors.inverse : colors.line,
          opacity: pressed ? 0.8 : 1,
        },
      ]}>
      {icon ? <Icon icon={icon} size={16} color={active ? 'onInverse' : 'text'} /> : null}
      <Text variant="caption" color={active ? 'onInverse' : 'text'}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
});
