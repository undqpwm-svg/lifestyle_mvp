import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { Text } from '../ui/text';

/** «Печатает…»: пузырь с тремя пульсирующими точками. */
export function TypingBubble({ label }: { label: string }) {
  const { colors } = useTheme();
  const [dots] = useState(() => [0, 1, 2].map(() => new Animated.Value(0.3)));

  useEffect(() => {
    const loops = dots.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(v, { toValue: 1, duration: 320, useNativeDriver: true }),
          Animated.timing(v, { toValue: 0.3, duration: 320, useNativeDriver: true }),
          Animated.delay((2 - i) * 160),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [dots]);

  return (
    <View style={styles.row} accessibilityLabel={label}>
      <View style={[styles.bubble, { backgroundColor: colors.surface, borderColor: colors.line }]}>
        {dots.map((v, i) => (
          <Animated.View key={i} style={[styles.dot, { backgroundColor: colors.textMuted, opacity: v }]} />
        ))}
      </View>
      <Text variant="caption" color="textMuted">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, marginVertical: 4 },
  bubble: { flexDirection: 'row', gap: 4, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 18, borderWidth: 1, borderBottomLeftRadius: 6 },
  dot: { width: 7, height: 7, borderRadius: 4 },
});
