import { Pressable, StyleSheet, View } from 'react-native';

import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { Text } from './text';

type Props<T extends string> = { options: { id: T; label: string }[]; value: T; onChange: (v: T) => void; stretch?: boolean };

export function Segmented<T extends string>({ options, value, onChange, stretch }: Props<T>) {
  const { colors } = useTheme();
  return (
    <View style={[styles.wrap, { backgroundColor: colors.surfaceAlt }, stretch && { alignSelf: 'stretch' }]}>
      {options.map((o) => {
        const active = o.id === value;
        return (
          <Pressable
            key={o.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.id)}
            style={[styles.btn, stretch && { flex: 1 }, active && { backgroundColor: colors.inverse }]}>
            <Text variant="label" color={active ? 'onInverse' : 'textMuted'}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', borderRadius: radius.pill, padding: 3, alignSelf: 'flex-start' },
  btn: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.pill, alignItems: 'center' },
});
