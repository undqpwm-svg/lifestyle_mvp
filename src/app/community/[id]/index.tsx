import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { MapPin, MessageCircle, Plus, Star, Users } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { interestById } from '@/api/interests';
import { useCommunity, useCreatePost, useEvents, useJoinCommunity, usePosts } from '@/api/queries';
import { communityCover } from '@/components/community-card';
import { ReviewList } from '@/components/review-list';
import { RatingBadge } from '@/components/stars';
import { EventCard } from '@/components/event-card';
import { INTEREST_ICONS } from '@/components/icons';
import { PostItem } from '@/components/post-item';
import { ReportButton } from '@/components/report-button';
import { Button } from '@/components/ui/button';
import { Cover } from '@/components/ui/cover';
import { Icon } from '@/components/ui/icon';
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
      <Cover
        uri={communityCover(c, 1200)}
        fallbackIcon={c.interests[0] ? INTEREST_ICONS[c.interests[0]] : Users}
        style={styles.hero}
        iconSize={56}
      />
      <View style={styles.head}>
        <Text variant="h2">{c.name}</Text>
        <View style={styles.metaRow}>
          <View style={styles.meta}>
            <Icon icon={MapPin} size={14} color="textMuted" />
            <Text variant="caption" color="textMuted">{getCity(c.cityId).name[lang]}</Text>
          </View>
          <View style={styles.meta}>
            <Icon icon={Users} size={14} color="textMuted" />
            <Text variant="caption" color="textMuted">
              {c.membersCount} {t.common.members}
            </Text>
          </View>
          {c.interests.map((i) => (
            <View key={i} style={styles.meta}>
              <Icon icon={INTEREST_ICONS[i]} size={14} color="textMuted" />
              <Text variant="caption" color="textMuted">{interestById.get(i)?.name[lang]}</Text>
            </View>
          ))}
        </View>
        {c.rating ? <RatingBadge avg={c.rating.avg} count={c.rating.count} /> : null}
        <Text color="textMuted">{c.description}</Text>
      </View>

      <MembershipActions id={c.id} role={c.myRole} />

      {canManage ? (
        <Button
          title={t.community.newEvent}
          icon={Plus}
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
        {tab === 'events' ? <CommunityEvents id={c.id} cityId={c.cityId} /> : <CommunityFeed id={c.id} canPost={canManage} />}
      </View>

      <View style={{ height: spacing.xl }} />
      <ReviewList hostType="community" hostId={c.id} limit={3} />

      {c.myRole !== 'owner' ? (
        <View style={styles.footer}>
          <ReportButton target="community" targetId={c.id} />
        </View>
      ) : null}
    </Screen>
  );
}

function MembershipActions({ id, role }: { id: string; role: string | null }) {
  const { t } = useAppSettings();
  const join = useJoinCommunity();
  return (
    <View style={styles.actions}>
      {role === 'owner' ? (
        <Button title={t.community.owner} icon={Star} variant="ghost" disabled style={styles.flex} />
      ) : (
        <Button
          title={role ? t.community.leave : t.community.join}
          variant={role ? 'ghost' : 'primary'}
          loading={join.isPending}
          style={styles.flex}
          onPress={() => join.mutate({ id, join: !role })}
        />
      )}
      <Button
        title={t.community.chat}
        icon={MessageCircle}
        variant="dark"
        style={styles.chatBtn}
        onPress={() => router.push({ pathname: '/community/[id]/chat', params: { id } })}
      />
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

// Объявления пишут владелец и модераторы; общение участников — в чате.
function CommunityFeed({ id, canPost }: { id: string; canPost: boolean }) {
  const { t } = useAppSettings();
  const posts = usePosts(id);
  const create = useCreatePost(id);
  const [text, setText] = useState('');

  return (
    <View style={{ gap: spacing.md }}>
      {canPost ? (
        <View style={{ gap: spacing.sm }}>
          <TextField placeholder={t.community.postPlaceholder} value={text} onChangeText={setText} multiline maxLength={2000} />
          <Button
            title={t.community.send}
            disabled={!text.trim()}
            loading={create.isPending}
            onPress={() => create.mutate(text, { onSuccess: () => setText('') })}
          />
        </View>
      ) : null}
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
  hero: { height: 200, marginHorizontal: -spacing.lg },
  head: { gap: spacing.sm, paddingTop: spacing.lg, paddingBottom: spacing.lg },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', columnGap: spacing.md, rowGap: 4 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  center: { textAlign: 'center' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.lg },
  flex: { flex: 1, minWidth: 140 },
  chatBtn: { flex: 1, minWidth: 140, paddingHorizontal: spacing.md },
  tabBody: { paddingTop: spacing.lg },
  footer: { alignItems: 'center', paddingTop: spacing.xl },
});
