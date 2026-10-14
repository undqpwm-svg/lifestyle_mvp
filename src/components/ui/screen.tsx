import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type ScrollViewProps } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { spacing, type ThemeColors } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  refreshControl?: ScrollViewProps['refreshControl'];
  background?: keyof ThemeColors;
  /** Отступ снизу под плавающий таббар */
  tabBarInset?: boolean;
};

// Общий контейнер экрана: фон темы, safe area, клавиатура, ограничение ширины для планшетов и веба.
export function Screen({ children, scroll = true, edges = ['top'], refreshControl, background = 'background', tabBarInset }: Props) {
  const { colors } = useTheme();
  const body = <View style={styles.inner}>{children}</View>;
  return (
    <SafeAreaView edges={edges} style={[styles.root, { backgroundColor: colors[background] }]}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {scroll ? (
          <ScrollView
            contentContainerStyle={[styles.scroll, { paddingBottom: tabBarInset ? 120 : spacing.xxl }]}
            contentInsetAdjustmentBehavior="automatic"
            keyboardShouldPersistTaps="handled"
            refreshControl={refreshControl}
            showsVerticalScrollIndicator={false}>
            {body}
          </ScrollView>
        ) : (
          body
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1 },
  inner: { flex: 1, width: '100%', maxWidth: 640, alignSelf: 'center', paddingHorizontal: spacing.lg },
});
