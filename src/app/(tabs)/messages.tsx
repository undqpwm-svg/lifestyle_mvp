import { router } from 'expo-router';
import { CalendarDays, Image as ImageIcon, Mic, SquarePen } from 'lucide-react-native';
import { Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { useConversations } from '@/api/queries';
import type { Conversation } from '@/api/types';
import { useMe } from '@/auth/auth-context';
import { DeliveryTicks } from '@/components/chat/delivery-ticks';
import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { Screen } from '@/components/ui/screen';
import { EmptyView, LoadingView } from '@/components/ui/state-view';
import { Text } from '@/components/ui/text';
import { formatDay, formatTime, isSameDay } from '@/lib/format';
import { useNow } from '@/lib/use-now';
import { useAppSettings } from '@/state/app-settings';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

export default function MessagesScreen() {
  const { colors } = useTheme();
  const { t } = useAppSettings();
  const list = useConversations();

  return (
    <Screen tabBarInset refreshControl={<RefreshControl refreshing={list.isRefetching} onRefresh={list.refetch} tintColor={colors.text} />}>
      <View style={styles.header}>
        <Text variant="h1">{t.messages.title}</Text>
        <IconButton icon={SquarePen} label={t.messages.newMessage} onPress={() => router.push('/messages/new')} />
      </View>
      {list.isPending ? (
        <LoadingView />
      ) : !list.data?.length ? (
        <EmptyView title={t.messages.empty} hint={t.messages.emptyHint} />
      ) : (
        <View style={[styles.list, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          {list.data.map((c, i) => (
            <ConversationRow key={c.id} c={c} first={i === 0} />
          ))}
        </View>
      )}
    </Screen>
  );
}

function ConversationRow({ c, first }: { c: Conversation; first: boolean }) {
  const { colors } = useTheme();
  const { t, lang } = useAppSettings();
  const me = useMe();
  const now = useNow();
  const last = c.lastMessage;
  const preview = !last
    ? ''
    : last.kind === 'image'
      ? t.messages.photo
      : last.kind === 'voice'
        ? t.messages.voice
        : last.kind === 'event'
          ? t.messages.event
          : last.text;
  const kindIcon = last?.kind === 'image' ? ImageIcon : last?.kind === 'voice' ? Mic : last?.kind === 'event' ? CalendarDays : null;
  const when = last ? (isSameDay(last.createdAt, new Date(now).toISOString()) ? formatTime(last.createdAt, lang) : formatDay(last.createdAt, lang, t)) : '';

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/messages/[id]', params: { id: c.id } })}
      style={({ pressed }) => [styles.row, !first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line }, pressed && { opacity: 0.8 }]}>
      <Avatar name={c.peer.name} uri={c.peer.avatarUrl} size={48} />
      <View style={{ flex: 1, gap: 2 }}>
        <View style={styles.rowTop}>
          <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
            {c.peer.name}
          </Text>
          <Text variant="caption" color={c.unread ? 'text' : 'textFaint'}>
            {when}
          </Text>
        </View>
        <View style={styles.rowTop}>
          {c.peerTyping ? (
            <Text variant="caption" color="success" numberOfLines={1} style={{ flex: 1 }}>
              {t.messages.typing}
            </Text>
          ) : (
            <>
              {last?.authorId === me.id ? <DeliveryTicks status={last.status} size={14} /> : null}
              {kindIcon ? <Icon icon={kindIcon} size={14} color="textMuted" /> : null}
              <Text variant="caption" color={c.unread ? 'text' : 'textMuted'} numberOfLines={1} style={{ flex: 1 }}>
                {preview}
              </Text>
            </>
          )}
          {c.unread ? (
            <View style={[styles.badge, { backgroundColor: colors.accent }]}>
              <Text variant="label" color="onAccent">
                {c.unread}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.lg, paddingBottom: spacing.xl },
  list: { borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badge: { minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
});
