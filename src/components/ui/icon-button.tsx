import { Pressable, StyleSheet } from 'react-native';

import { useTheme } from '@/theme/use-theme';

import { Text } from './text';

// Круглая кнопка-иконка (например, «+» в шапке).
export function IconButton({ icon, onPress, label }: { icon: string; onPress: () => void; label: string }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.btn, { backgroundColor: colors.accent, opacity: pressed ? 0.85 : 1 }]}>
      <Text variant="h3" color="onAccent" style={styles.icon}>
        {icon}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 22, lineHeight: 24 },
});
