import { StyleSheet, View } from 'react-native';

import type { Post } from '@/api/types';
import { formatRelative } from '@/lib/format';
import { useAppSettings } from '@/state/app-settings';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { ReportButton } from './report-button';
import { Avatar } from './ui/avatar';
import { Text } from './ui/text';

export function PostItem({ post }: { post: Post }) {
  const { colors } = useTheme();
  const { lang } = useAppSettings();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
      <View style={styles.head}>
        <Avatar name={post.authorName} size={32} />
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">{post.authorName}</Text>
          <Text variant="caption" color="textFaint">
            {formatRelative(post.createdAt, lang)}
          </Text>
        </View>
        <ReportButton target="post" targetId={post.id} compact />
      </View>
      <Text>{post.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg, gap: spacing.md },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
