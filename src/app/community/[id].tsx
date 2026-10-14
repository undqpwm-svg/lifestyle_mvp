import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import { interestById } from '@/api/interests';
import { useCommunity, useCreatePost, useEvents, useJoinCommunity, usePosts } from '@/api/queries';
import { EventCard } from '@/components/event-card';
import { PostItem } from '@/components/post-item';
import { ReportButton } from '@/components/report-button';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Segmented } from '@/components/ui/segmented';
import { EmptyView, ErrorView, LoadingView } from '@/components/ui/state-view';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { getCity } from '@/config/cities';
import { errorMessage } from '@/lib/errors';
import { useAppSettings } from '@/state/app-settings';
import { spacing } from '@/theme/tokens';

type Tab = 'events' | 'feed';

export default function CommunityScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang } = useAppSettings();
  const { data: c, isPending, isError, refetch } = useCommunity(id);
  const [tab, setTab] = useState<Tab>('events');

  if (isError) return <Screen edges={['bottom']}><ErrorView onRetry={refetch} /></Screen>;
  if (isPending) return <Screen edges={['bottom']}><LoadingView /></Screen>;
  if (!c) return <Screen edges={['bottom']}><EmptyView title={t.community.notFound} /></Screen>;

  const canManage = c.myRole === 'owner' || c.myRole === 'moderator';

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: c.name }} />
      <View style={styles.head}>
        <Avatar name={c.name} emoji={interestById.get(c.interests[0])?.emoji} size={72} />
        <Text variant="h2" style={styles.center}>
          {c.name}
        </Text>
        <Text variant="caption" color="textMuted" style={styles.center}>
          📍 {getCity(c.cityId).name[lang]} · {c.membersCount} {t.common.members} ·{' '}
          {c.interests.map((i) => interestById.get(i)?.emoji).join(' ')}
        </Text>
        <Text color="textMuted" style={styles.center}>
          {c.description}
        </Text>
      </View>

      <MembershipActions id={c.id} role={c.myRole} telegramUrl={c.telegramUrl} />

      {canManage ? (
        <Button
          title={`＋ ${t.community.newEvent}`}
          variant="ghost"
          style={{ marginBottom: spacing.lg }}
          onPress={() => router.push({ pathname: '/event/new', params: { hostType: 'community', hostId: c.id } })}
        />
      ) : null}

      <Segmented
        stretch
        value={tab}
        onChange={setTab}
        options={[
          { id: 'events', label: t.community.events },
          { id: 'feed', label: t.community.feed },
        ]}
      />
      <View style={styles.tabBody}>
        {tab === 'events' ? <CommunityEvents id={c.id} cityId={c.cityId} /> : <CommunityFeed id={c.id} isMember={!!c.myRole} />}
      </View>

      {c.myRole !== 'owner' ? (
        <View style={styles.footer}>
          <ReportButton target="community" targetId={c.id} />
        </View>
      ) : null}
    </Screen>
  );
}

function MembershipActions({ id, role, telegramUrl }: { id: string; role: string | null; telegramUrl?: string }) {
  const { t } = useAppSettings();
  const join = useJoinCommunity();
  return (
    <View style={styles.actions}>
      {role === 'owner' ? (
        <Button title={`★ ${t.community.owner}`} variant="ghost" disabled style={styles.flex} />
      ) : (
        <Button
          title={role ? t.community.leave : t.community.join}
          variant={role ? 'ghost' : 'primary'}
          loading={join.isPending}
          style={styles.flex}
          onPress={() => join.mutate({ id, join: !role })}
        />
      )}
      {telegramUrl ? <Button title={t.community.chat} variant="dark" style={styles.chatBtn} onPress={() => Linking.openURL(telegramUrl)} /> : null}
      {join.error ? <Text variant="caption" color="danger">{errorMessage(join.error, t)}</Text> : null}
    </View>
  );
}

function CommunityEvents({ id, cityId }: { id: string; cityId: Parameters<typeof useEvents>[0]['cityId'] }) {
  const { t } = useAppSettings();
  const events = useEvents({ cityId, hostType: 'community', hostId: id });
  if (events.isPending) return <LoadingView />;
  if (!events.data?.length) return <EmptyView title={t.community.noEvents} />;
  return (
    <View style={{ gap: spacing.md }}>
      {events.data.map((e) => (
        <EventCard key={e.id} event={e} />
      ))}
    </View>
  );
}

function CommunityFeed({ id, isMember }: { id: string; isMember: boolean }) {
  const { t } = useAppSettings();
  const posts = usePosts(id);
  const create = useCreatePost(id);
  const [text, setText] = useState('');

  return (
    <View style={{ gap: spacing.md }}>
      {isMember ? (
        <View style={{ gap: spacing.sm }}>
          <TextField placeholder={t.community.postPlaceholder} value={text} onChangeText={setText} multiline maxLength={2000} />
          <Button
            title={t.community.send}
            disabled={!text.trim()}
            loading={create.isPending}
            onPress={() => create.mutate(text, { onSuccess: () => setText('') })}
          />
        </View>
      ) : (
        <Text variant="caption" color="textMuted" style={styles.center}>
          {t.community.joinToPost}
        </Text>
      )}
      {posts.isPending ? (
        <LoadingView />
      ) : !posts.data?.length ? (
        <EmptyView title={t.community.noPosts} />
      ) : (
        posts.data.map((p) => <PostItem key={p.id} post={p} />)
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  head: { alignItems: 'center', gap: spacing.sm, paddingTop: spacing.xl, paddingBottom: spacing.lg },
  center: { textAlign: 'center' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.lg },
  flex: { flex: 1, minWidth: 140 },
  chatBtn: { flex: 1, minWidth: 140, paddingHorizontal: spacing.md },
  tabBody: { paddingTop: spacing.lg },
  footer: { alignItems: 'center', paddingTop: spacing.xl },
});
