import { forwardRef, useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { fonts, radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { Text } from './text';

type Props = TextInputProps & { label?: string; hint?: string; error?: string | null; prefix?: string };

export const TextField = forwardRef<TextInput, Props>(function TextField(
  { label, hint, error, prefix, multiline, style, onFocus, onBlur, ...rest },
  ref,
) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const borderColor = error ? colors.danger : focused ? colors.text : colors.line;

  return (
    <View style={styles.wrap}>
      {label ? (
        <Text variant="caption" color="textMuted">
          {label}
        </Text>
      ) : null}
      <View style={[styles.box, { borderColor, backgroundColor: colors.surface }, multiline && styles.multiBox]}>
        {prefix ? <Text variant="bodyStrong">{prefix}</Text> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textFaint}
          multiline={multiline}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, { color: colors.text }, multiline && styles.multiInput, style]}
          {...rest}
        />
      </View>
      {error || hint ? (
        <Text variant="caption" color={error ? 'danger' : 'textFaint'}>
          {error || hint}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  box: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  multiBox: { alignItems: 'flex-start', paddingVertical: spacing.md },
  input: { flex: 1, fontFamily: fonts.body, fontSize: 16, paddingVertical: spacing.md, outlineStyle: 'none' } as object,
  multiInput: { minHeight: 96, textAlignVertical: 'top', paddingVertical: 0 },
});
