import { router, Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ORG_TYPES } from '@/api/interests';
import { useEvents, useOrganization } from '@/api/queries';
import { useMe } from '@/auth/auth-context';
import { EventCard } from '@/components/event-card';
import { ReportButton } from '@/components/report-button';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
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
      <View style={styles.head}>
        <Avatar name={org.name} emoji={type?.emoji} size={72} />
        <Text variant="h2" style={styles.center}>
          {org.name}
        </Text>
        <Text variant="caption" color="textMuted" style={styles.center}>
          {type?.name[lang]}
          {org.status === 'verified' ? `  ·  ✓ ${t.common.verified}` : ''}
        </Text>
        <Text variant="caption" color="textMuted" style={styles.center}>
          📍 {org.address}
        </Text>
        {org.description ? (
          <Text color="textMuted" style={styles.center}>
            {org.description}
          </Text>
        ) : null}
      </View>

      {isOwner && org.status !== 'verified' ? (
        <View style={[styles.banner, { backgroundColor: org.status === 'pending' ? colors.accentSoft : colors.surfaceAlt }]}>
          <Text variant="bodyStrong">{org.status === 'pending' ? `⏳ ${t.org.pending}` : t.org.rejected}</Text>
          {org.status === 'pending' ? <Text variant="caption" color="textMuted">{t.org.pendingHint}</Text> : null}
        </View>
      ) : null}

      {isOwner && org.status !== 'rejected' ? (
        <Button
          title={`＋ ${t.org.newEvent}`}
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

      {!isOwner ? (
        <View style={styles.footer}>
          <ReportButton target="organization" targetId={org.id} />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { alignItems: 'center', gap: spacing.sm, paddingTop: spacing.xl, paddingBottom: spacing.xl },
  center: { textAlign: 'center' },
  banner: { padding: spacing.lg, borderRadius: radius.md, gap: spacing.xs, marginBottom: spacing.lg },
  footer: { alignItems: 'center' },
});
