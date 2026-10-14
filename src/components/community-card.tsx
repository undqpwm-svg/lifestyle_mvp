import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { interestById } from '@/api/interests';
import type { Community } from '@/api/types';
import { useAppSettings } from '@/state/app-settings';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { Avatar } from './ui/avatar';
import { Text } from './ui/text';

export function CommunityCard({ community }: { community: Community }) {
  const { colors } = useTheme();
  const { lang, t } = useAppSettings();
  const first = interestById.get(community.interests[0]);
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => router.push({ pathname: '/community/[id]', params: { id: community.id } })}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.line, opacity: pressed ? 0.9 : 1 },
      ]}>
      <Avatar name={community.name} emoji={first?.emoji} size={52} />
      <View style={styles.body}>
        <Text variant="h3" numberOfLines={1}>
          {community.name}
        </Text>
        <Text variant="caption" color="textMuted" numberOfLines={2}>
          {community.description}
        </Text>
        <Text variant="caption">
          {community.membersCount} {t.common.members}
          {community.myRole ? ' · ✓' : ''}
          {' · '}
          {community.interests
            .map((i) => interestById.get(i)?.name[lang])
            .filter(Boolean)
            .join(', ')}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', gap: spacing.md, borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg },
  body: { flex: 1, gap: 4 },
});
