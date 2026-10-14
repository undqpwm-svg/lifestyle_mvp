import { ActivityIndicator, Pressable, StyleSheet, type PressableProps, type ViewStyle } from 'react-native';

import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { Icon, type LucideIcon } from './icon';
import { Text } from './text';

type Variant = 'primary' | 'dark' | 'ghost';

type Props = Omit<PressableProps, 'style'> & {
  title: string;
  icon?: LucideIcon;
  variant?: Variant;
  loading?: boolean;
  style?: ViewStyle;
};

export function Button({ title, icon, variant = 'primary', loading, disabled, style, ...rest }: Props) {
  const { colors } = useTheme();
  const bg = { primary: colors.accent, dark: colors.inverse, ghost: 'transparent' }[variant];
  const fg = { primary: 'onAccent', dark: 'onInverse', ghost: 'text' } as const;
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bg, opacity: isDisabled ? 0.45 : pressed ? 0.85 : 1 },
        variant === 'ghost' && { borderWidth: 1, borderColor: colors.line },
        pressed && { transform: [{ scale: 0.98 }] },
        style,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={colors[fg[variant]]} />
      ) : (
        <>
          {icon ? <Icon icon={icon} size={18} color={fg[variant]} /> : null}
          <Text variant="bodyStrong" color={fg[variant]} numberOfLines={1}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
