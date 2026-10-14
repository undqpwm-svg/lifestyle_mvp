import { ChevronRight } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { Icon, type LucideIcon } from './ui/icon';
import { Text } from './ui/text';

type Props = {
  label: string;
  icon?: LucideIcon;
  value?: string;
  valueIcon?: LucideIcon;
  right?: ReactNode;
  onPress?: () => void;
  last?: boolean;
};

export function SettingsRow({ label, icon, value, valueIcon, right, onPress, last }: Props) {
  const { colors } = useTheme();
  const rowStyle = [
    styles.row,
    !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  ];
  const content = (
    <>
      {icon ? <Icon icon={icon} size={20} color="textMuted" /> : null}
      <Text variant="bodyStrong" style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.right}>
        {valueIcon ? <Icon icon={valueIcon} size={16} color="textMuted" /> : null}
        {value ? <Text color="textMuted">{value}</Text> : null}
        {right}
        {onPress && !right ? <Icon icon={ChevronRight} size={18} color="textFaint" /> : null}
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
    gap: spacing.md,
  },
  label: { flex: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
