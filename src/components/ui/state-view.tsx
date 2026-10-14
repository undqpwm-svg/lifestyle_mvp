import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAppSettings } from '@/state/app-settings';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { Button } from './button';
import { Text } from './text';

// Заглушки состояний загрузки/ошибки/пустого списка — единые для всех экранов.
export function LoadingView() {
  const { colors } = useTheme();
  return (
    <View style={styles.box}>
      <ActivityIndicator color={colors.text} />
    </View>
  );
}

export function ErrorView({ onRetry }: { onRetry: () => void }) {
  const { t } = useAppSettings();
  return (
    <View style={styles.box}>
      <Text color="textMuted" style={styles.center}>
        {t.common.error}
      </Text>
      <Button title={t.common.retry} variant="ghost" onPress={onRetry} />
    </View>
  );
}

export function EmptyView({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <View style={styles.box}>
      <Text variant="h3" style={styles.center}>
        {title}
      </Text>
      {hint ? (
        <Text color="textMuted" style={styles.center}>
          {hint}
        </Text>
      ) : null}
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { paddingVertical: spacing.xxl * 2, alignItems: 'center', gap: spacing.lg },
  center: { textAlign: 'center' },
});
