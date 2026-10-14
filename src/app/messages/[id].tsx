import { router, useLocalSearchParams } from 'expo-router';
import { ShieldAlert, UserPlus } from 'lucide-react-native';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { api } from '@/api/client';
import { useConversation, useDeleteDirectMessage, useDirectMessages, useFriendAction, useReport, useSendDirectMessage } from '@/api/queries';
import { useMe } from '@/auth/auth-context';
import { ChatHeader } from '@/components/chat/chat-header';
import { ChatThread } from '@/components/chat/chat-thread';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { EmptyView, LoadingView } from '@/components/ui/state-view';
import { Text } from '@/components/ui/text';
import { useAppSettings } from '@/state/app-settings';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

// Личный диалог: писать можно и друзьям, и не друзьям (для незнакомых — предупреждение и «Добавить в друзья»).
export default function DirectChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { t } = useAppSettings();
  const me = useMe();
  const conv = useConversation(id);
  const messages = useDirectMessages(id);
  const send = useSendDirectMessage(id);
  const remove = useDeleteDirectMessage(id);
  const friend = useFriendAction();
  const report = useReport();
  const c = conv.data;
  const peer = c?.peer;
  const lastId = messages.data?.[0]?.id;

  // Пока диалог открыт — новые входящие считаются прочитанными.
  useEffect(() => {
    if (lastId) api.markConversationRead(id).catch(() => {});
  }, [id, lastId]);

  const openProfile = () => peer && router.push({ pathname: '/user/[id]', params: { id: peer.id } });

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ChatHeader
        fallback={() => router.replace('/messages')}
        onPress={openProfile}
        title={peer?.name ?? ''}
        subtitle={c?.peerTyping ? t.messages.typing : undefined}
        avatar={peer ? <Avatar name={peer.name} uri={peer.avatarUrl} size={40} /> : null}
      />
      {conv.isPending ? (
        <LoadingView />
      ) : c && !c.canMessage ? (
        <View style={styles.blockedWrap}>
          <EmptyView
            title={t.messages.blocked}
            hint={c.blockedByMe ? t.people.blockedNote : undefined}
            action={
              c.blockedByMe ? (
                <Button title={t.people.unblock} variant="ghost" onPress={() => friend.mutate({ userId: c.peer.id, action: 'unblock' })} />
              ) : undefined
            }
          />
        </View>
      ) : (
        <ChatThread
          messages={messages.data ?? []}
          loading={messages.isPending}
          meId={me.id}
          showAuthors={false}
          typingLabel={c?.peerTyping ? `${peer?.name.split(' ')[0]} ${t.messages.typing}` : null}
          onTyping={() => api.setTyping(id).catch(() => {})}
          onSend={(m, onError) => send.mutate(m, { onError })}
          canDelete={(m) => m.authorId === me.id}
          onDelete={(m) => remove.mutate(m.id)}
          onReport={(m) => report.mutate({ target: 'message', targetId: m.id, reason: 'other' })}
          banner={
            c && !c.isFriend ? (
              <View style={[styles.banner, { backgroundColor: colors.surfaceAlt }]}>
                <Icon icon={ShieldAlert} size={18} color="textMuted" />
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong">{t.messages.notFriend}</Text>
                  <Text variant="caption" color="textMuted">
                    {t.messages.notFriendHint}
                  </Text>
                </View>
                {!friend.isSuccess ? (
                  <Button
                    title=""
                    icon={UserPlus}
                    variant="dark"
                    style={styles.add}
                    accessibilityLabel={t.people.addFriend}
                    loading={friend.isPending}
                    onPress={() => peer && friend.mutate({ userId: peer.id, action: 'request' })}
                  />
                ) : null}
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, marginHorizontal: spacing.md, marginBottom: spacing.sm, borderRadius: radius.md },
  add: { minHeight: 40, paddingHorizontal: spacing.md },
  blockedWrap: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl },
});
