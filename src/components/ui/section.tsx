import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { spacing } from '@/theme/tokens';

import { Text } from './text';

export function Section({ title, action, onAction, children }: { title: string; action?: string; onAction?: () => void; children: ReactNode }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text variant="h3">{title}</Text>
        {action ? (
          <Pressable onPress={onAction} hitSlop={8}>
            <Text variant="caption" style={{ textDecorationLine: 'underline' }}>
              {action}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md, marginBottom: spacing.xl },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
