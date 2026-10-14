import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { Text } from './ui/text';

type Props = { label: string; value?: string; right?: ReactNode; onPress?: () => void; last?: boolean };

export function SettingsRow({ label, value, right, onPress, last }: Props) {
  const { colors } = useTheme();
  const rowStyle = [
    styles.row,
    !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  ];
  const content = (
    <>
      <Text variant="bodyStrong">{label}</Text>
      <View style={styles.right}>
        {value ? <Text color="textMuted">{value}</Text> : null}
        {right}
        {onPress && !right ? <Text color="textFaint">›</Text> : null}
      </View>
    </>
  );

  // Без onPress — обычный View: отключённый Pressable на вебе блокирует вложенные кнопки.
  if (!onPress) return <View style={rowStyle}>{content}</View>;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [rowStyle, pressed && { opacity: 0.7 }]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 54,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  right: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
