import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { Text } from './text';

// Нижняя шторка поверх экрана: выбор города, причины жалобы и т.п.
export function Sheet({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* Внутренний Pressable гасит нажатия, чтобы тап по шторке её не закрывал */}
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: spacing.xl + insets.bottom }]}>
          {title ? (
            <Text variant="h3" style={{ marginBottom: spacing.md }}>
              {title}
            </Text>
          ) : null}
          <ScrollView bounces={false} contentContainerStyle={{ gap: spacing.sm }}>
            {children}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function SheetOption({ label, hint, active, onPress }: { label: string; hint?: string; active?: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        { borderColor: colors.line, backgroundColor: active ? colors.accentSoft : colors.surface, opacity: pressed ? 0.8 : 1 },
      ]}>
      <Text variant="bodyStrong" style={{ flex: 1 }}>
        {label}
        {hint ? (
          <Text variant="caption" color="textMuted">
            {'\n'}
            {hint}
          </Text>
        ) : null}
      </Text>
      {active ? <Text variant="bodyStrong">✓</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    padding: spacing.xl,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    width: '100%',
    maxWidth: 640,
    maxHeight: '85%',
    alignSelf: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
  },
});
