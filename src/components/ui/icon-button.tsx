import { Pressable, StyleSheet } from 'react-native';

import { useTheme } from '@/theme/use-theme';

import { Icon, type LucideIcon } from './icon';

// Круглая кнопка-иконка (например, «создать» в шапке).
export function IconButton({ icon, onPress, label }: { icon: LucideIcon; onPress: () => void; label: string }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.btn, { backgroundColor: colors.inverse, opacity: pressed ? 0.85 : 1 }]}>
      <Icon icon={icon} size={20} color="onInverse" strokeWidth={2.4} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
