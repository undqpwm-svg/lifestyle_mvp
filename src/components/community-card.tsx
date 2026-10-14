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
import { RatingBadge } from './stars';
import { Cover } from './ui/cover';
import { Icon } from './ui/icon';
import { Text } from './ui/text';

export function communityCover(c: Pick<Community, 'coverUrl' | 'interests'>, width?: number) {
  return c.coverUrl ?? (c.interests[0] ? pexels(DEFAULT_COVERS[c.interests[0]], width) : undefined);
}

// Карточка сообщества: обложка сверху, название и описание целиком, темы — чипами с переносом.
export function CommunityCard({ community }: { community: Community }) {
  const { colors } = useTheme();
  const { lang, t } = useAppSettings();
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => router.push({ pathname: '/community/[id]', params: { id: community.id } })}
      style={({ pressed }) => [styles.card, { backgroundColor: colors.surface, borderColor: colors.line, opacity: pressed ? 0.92 : 1 }]}>
      <Cover
        uri={communityCover(community, 720)}
        fallbackIcon={community.interests[0] ? INTEREST_ICONS[community.interests[0]] : Users}
        iconSize={36}
        style={styles.cover}>
        {community.myRole ? (
          <View style={[styles.member, { backgroundColor: colors.inverse }]}>
            <Icon icon={Check} size={13} color="onInverse" strokeWidth={3} />
            <Text variant="label" color="onInverse">
              {t.communities.mine}
            </Text>
          </View>
        ) : null}
      </Cover>
      <View style={styles.body}>
        <Text variant="h3">{community.name}</Text>
        {community.description ? <Text color="textMuted">{community.description}</Text> : null}
        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Icon icon={Users} size={14} color="textMuted" />
            <Text variant="caption" color="textMuted">
              {community.membersCount} {t.common.members}
            </Text>
          </View>
          {community.rating ? <RatingBadge avg={community.rating.avg} count={community.rating.count} /> : null}
        </View>
        <View style={styles.tags}>
          {community.interests.map((i) => (
            <View key={i} style={[styles.tag, { backgroundColor: colors.surfaceAlt }]}>
              <Icon icon={INTEREST_ICONS[i]} size={13} />
              <Text variant="label">{interestById.get(i)?.name[lang]}</Text>
            </View>
          ))}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden' },
  cover: { height: 130 },
  member: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  body: { padding: spacing.lg, gap: spacing.sm },
  meta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: spacing.lg, rowGap: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
});
