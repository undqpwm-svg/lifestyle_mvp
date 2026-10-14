import { router, Stack, useLocalSearchParams } from 'expo-router';
import { BadgeCheck, ChartColumn, Hourglass, MapPin, Plus } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { ORG_TYPES } from '@/api/interests';
import { useEvents, useOrganization } from '@/api/queries';
import { useMe } from '@/auth/auth-context';
import { EventCard } from '@/components/event-card';
import { ORG_TYPE_ICONS } from '@/components/icons';
import { ReportButton } from '@/components/report-button';
import { ReviewList } from '@/components/review-list';
import { RatingBadge } from '@/components/stars';
import { Button } from '@/components/ui/button';
import { Cover } from '@/components/ui/cover';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { Section } from '@/components/ui/section';
import { EmptyView, ErrorView, LoadingView } from '@/components/ui/state-view';
import { Text } from '@/components/ui/text';
import { useAppSettings } from '@/state/app-settings';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

export default function OrganizationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const me = useMe();
  const { t, lang, cityId } = useAppSettings();
  const { data: org, isPending, isError, refetch } = useOrganization(id);
  const events = useEvents({ cityId: org?.cityId ?? cityId, hostType: 'organization', hostId: id });

  if (isError) return <Screen edges={['bottom']}><ErrorView onRetry={refetch} /></Screen>;
  if (isPending) return <Screen edges={['bottom']}><LoadingView /></Screen>;
  if (!org) return <Screen edges={['bottom']}><EmptyView title={t.org.notFound} /></Screen>;

  const type = ORG_TYPES.find((x) => x.id === org.type);
  const isOwner = org.ownerId === me.id;

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: org.name }} />
      <Cover uri={org.coverUrl} fallbackIcon={ORG_TYPE_ICONS[org.type]} style={styles.hero} iconSize={56} />
      <View style={styles.head}>
        <Text variant="h2">{org.name}</Text>
        <View style={styles.meta}>
          <Icon icon={ORG_TYPE_ICONS[org.type]} size={14} color="textMuted" />
          <Text variant="caption" color="textMuted">{type?.name[lang]}</Text>
          {org.status === 'verified' ? (
            <>
              <Icon icon={BadgeCheck} size={14} />
              <Text variant="caption">{t.common.verified}</Text>
            </>
          ) : null}
        </View>
        {org.rating ? <RatingBadge avg={org.rating.avg} count={org.rating.count} /> : null}
        <View style={styles.meta}>
          <Icon icon={MapPin} size={14} color="textMuted" />
          <Text variant="caption" color="textMuted">{org.address}</Text>
        </View>
        {org.description ? <Text color="textMuted">{org.description}</Text> : null}
      </View>

      {isOwner && org.status !== 'verified' ? (
        <View style={[styles.banner, { backgroundColor: org.status === 'pending' ? colors.accentSoft : colors.surfaceAlt }]}>
          <View style={styles.meta}>
            {org.status === 'pending' ? <Icon icon={Hourglass} size={16} /> : null}
            <Text variant="bodyStrong">{org.status === 'pending' ? t.org.pending : t.org.rejected}</Text>
          </View>
          {org.status === 'pending' ? <Text variant="caption" color="textMuted">{t.org.pendingHint}</Text> : null}
        </View>
      ) : null}

      {isOwner ? (
        <Button
          title={t.dashboard.title}
          icon={ChartColumn}
          variant="dark"
          style={{ marginBottom: spacing.md }}
          onPress={() => router.push({ pathname: '/org/[id]/dashboard', params: { id: org.id } })}
        />
      ) : null}

      {isOwner && org.status !== 'rejected' ? (
        <Button
          title={t.org.newEvent}
          icon={Plus}
          style={{ marginBottom: spacing.xl }}
          onPress={() => router.push({ pathname: '/event/new', params: { hostType: 'organization', hostId: org.id } })}
        />
      ) : null}

      <Section title={t.org.events}>
        {events.isPending ? (
          <LoadingView />
        ) : !events.data?.length ? (
          <Text color="textMuted">{t.org.noEvents}</Text>
        ) : (
          events.data.map((e) => <EventCard key={e.id} event={e} />)
        )}
      </Section>

      <ReviewList hostType="organization" hostId={org.id} />

      {!isOwner ? (
        <View style={styles.footer}>
          <ReportButton target="organization" targetId={org.id} />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { height: 200, marginHorizontal: -spacing.lg },
  head: { gap: spacing.sm, paddingTop: spacing.lg, paddingBottom: spacing.xl },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  center: { textAlign: 'center' },
  banner: { padding: spacing.lg, borderRadius: radius.md, gap: spacing.xs, marginBottom: spacing.lg },
  footer: { alignItems: 'center' },
});
