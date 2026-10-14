import { router, useLocalSearchParams } from 'expo-router';
import { Users } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { useCommunity, useDeleteMessage, useJoinCommunity, useMessages, useReport, useSendMessage } from '@/api/queries';
import { useMe } from '@/auth/auth-context';
import { ChatHeader } from '@/components/chat/chat-header';
import { ChatThread } from '@/components/chat/chat-thread';
import { communityCover } from '@/components/community-card';
import { INTEREST_ICONS } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Cover } from '@/components/ui/cover';
import { EmptyView, LoadingView } from '@/components/ui/state-view';
import { useAppSettings } from '@/state/app-settings';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

export default function CommunityChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { t } = useAppSettings();
  const me = useMe();
  const community = useCommunity(id);
  const c = community.data;
  const isMember = !!c?.myRole;
  const canModerate = c?.myRole === 'owner' || c?.myRole === 'moderator';
  const messages = useMessages(id, isMember);
  const send = useSendMessage(id);
  const remove = useDeleteMessage(id);
  const join = useJoinCommunity();
  const report = useReport();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ChatHeader
        fallback={() => router.replace({ pathname: '/community/[id]', params: { id } })}
        onPress={() => router.push({ pathname: '/community/[id]', params: { id } })}
        title={c?.name ?? ''}
        subtitle={c ? `${c.membersCount} ${t.chat.members}` : undefined}
        avatar={
          c ? (
            <Cover uri={communityCover(c, 160)} fallbackIcon={c.interests[0] ? INTEREST_ICONS[c.interests[0]] : Users} radius={radius.sm} iconSize={18} style={styles.thumb} />
          ) : null
        }
      />
      {community.isPending ? (
        <LoadingView />
      ) : !isMember ? (
        <View style={styles.gate}>
          <EmptyView
            title={t.chat.membersOnly}
            hint={t.chat.membersOnlyHint}
            action={<Button title={t.chat.join} loading={join.isPending} onPress={() => join.mutate({ id, join: true })} />}
          />
        </View>
      ) : (
        <ChatThread
          messages={messages.data ?? []}
          loading={messages.isPending}
          meId={me.id}
          showAuthors
          onSend={(m, onError) => send.mutate(m, { onError })}
          // Удалить: автор — своё, модератор и владелец — любое
          canDelete={(m) => m.authorId === me.id || canModerate}
          onDelete={(m) => remove.mutate(m.id)}
          onReport={(m) => report.mutate({ target: 'message', targetId: m.id, reason: 'other' })}
          onAuthorPress={(userId) => router.push({ pathname: '/user/[id]', params: { id: userId } })}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  thumb: { width: 40, height: 40 },
  gate: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl },
});
