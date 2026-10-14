import { Star } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { palette } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { Icon } from './ui/icon';
import { Text } from './ui/text';

/** Звёзды рейтинга: только показ или выбор оценки (onChange). */
export function Stars({ value, size = 16, onChange }: { value: number; size?: number; onChange?: (v: number) => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= Math.round(value);
        const star = <Star size={size} color={filled ? palette.yellow : colors.line} fill={filled ? palette.yellow : 'transparent'} strokeWidth={1.6} />;
        return onChange ? (
          <Pressable key={i} accessibilityRole="button" accessibilityLabel={`${i}`} hitSlop={6} onPress={() => onChange(i)}>
            {star}
          </Pressable>
        ) : (
          <View key={i}>{star}</View>
        );
      })}
    </View>
  );
}

/** «★ 4.8 · 12» */
export function RatingBadge({ avg, count }: { avg: number; count: number }) {
  return (
    <View style={styles.badge}>
      <Icon icon={Star} size={14} tint={palette.yellow} />
      <Text variant="caption">
        {avg.toFixed(1)}
        <Text variant="caption" color="textMuted">
          {' '}
          · {count}
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
