import { router } from 'expo-router';
import { Check, Users } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { interestById } from '@/api/interests';
import type { Community } from '@/api/types';
import { DEFAULT_COVERS, pexels } from '@/lib/media';
import { useAppSettings } from '@/state/app-settings';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { INTEREST_ICONS } from './icons';
import { Cover } from './ui/cover';
import { Icon } from './ui/icon';
import { Text } from './ui/text';

export function communityCover(c: Pick<Community, 'coverUrl' | 'interests'>, width?: number) {
  return c.coverUrl ?? (c.interests[0] ? pexels(DEFAULT_COVERS[c.interests[0]], width) : undefined);
}

export function CommunityCard({ community }: { community: Community }) {
  const { colors } = useTheme();
  const { lang, t } = useAppSettings();
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => router.push({ pathname: '/community/[id]', params: { id: community.id } })}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.line, opacity: pressed ? 0.92 : 1 },
      ]}>
      <Cover
        uri={communityCover(community, 240)}
        fallbackIcon={community.interests[0] ? INTEREST_ICONS[community.interests[0]] : Users}
        radius={radius.md}
        iconSize={26}
        style={styles.thumb}
      />
      <View style={styles.body}>
        <Text variant="h3" numberOfLines={1}>
          {community.name}
        </Text>
        <Text variant="caption" color="textMuted" numberOfLines={2}>
          {community.description}
        </Text>
        <View style={styles.meta}>
          <Icon icon={Users} size={14} color="textMuted" />
          <Text variant="caption" color="textMuted" numberOfLines={1} style={{ flexShrink: 1 }}>
            {community.membersCount} {t.common.members} ·{' '}
            {community.interests
              .map((i) => interestById.get(i)?.name[lang])
              .filter(Boolean)
              .join(', ')}
          </Text>
          {community.myRole ? <Icon icon={Check} size={14} color="text" strokeWidth={3} /> : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', gap: spacing.md, borderRadius: radius.lg, borderWidth: 1, padding: spacing.md },
  thumb: { width: 76, height: 76 },
  body: { flex: 1, gap: 4, justifyContent: 'center' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
