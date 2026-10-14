import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { useReviews } from '@/api/queries';
import type { HostType } from '@/api/types';
import { formatRelative } from '@/lib/format';
import { useAppSettings } from '@/state/app-settings';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { RatingBadge, Stars } from './stars';
import { Avatar } from './ui/avatar';
import { Section } from './ui/section';
import { Text } from './ui/text';

/** Отзывы об организаторе (организации или сообществе). */
export function ReviewList({ hostType, hostId, limit = 5 }: { hostType: HostType; hostId: string; limit?: number }) {
  const { colors } = useTheme();
  const { t, lang } = useAppSettings();
  const reviews = useReviews(hostType, hostId);
  const list = reviews.data ?? [];
  const avg = list.length ? list.reduce((s, r) => s + r.rating, 0) / list.length : 0;

  return (
    <Section title={t.event.reviews}>
      {list.length === 0 ? (
        <Text color="textMuted">{t.event.noReviews}</Text>
      ) : (
        <>
          <RatingBadge avg={avg} count={list.length} />
          {list.slice(0, limit).map((r) => (
            <View key={r.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
              <Pressable style={styles.head} onPress={() => router.push({ pathname: '/user/[id]', params: { id: r.userId } })}>
                <Avatar name={r.userName} size={32} />
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong">{r.userName}</Text>
                  <Text variant="caption" color="textFaint" numberOfLines={1}>
                    {r.eventTitle} · {formatRelative(r.createdAt, lang)}
                  </Text>
                </View>
                <Stars value={r.rating} size={13} />
              </Pressable>
              {r.text ? <Text>{r.text}</Text> : null}
            </View>
          ))}
        </>
      )}
    </Section>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg, gap: spacing.sm },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
