import { Check, Send } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useConversations, useFriends, useShareEvent } from '@/api/queries';
import type { EventItem, Friend } from '@/api/types';
import { useAppSettings } from '@/state/app-settings';
import { spacing } from '@/theme/tokens';

import { FriendList } from './friend-list';
import { Icon } from './ui/icon';
import { Sheet } from './ui/sheet';
import { EmptyView } from './ui/state-view';

/**
 * «Поделиться» встречей в личные сообщения: сверху «Важные» друзья (с кем больше всего переписки),
 * ниже — друзья и недавние собеседники. Тап — встреча уходит карточкой в личку.
 */
export function ShareEventSheet({ event, onClose }: { event: EventItem; onClose: () => void }) {
  const { t } = useAppSettings();
  const friends = useFriends();
  const conversations = useConversations();
  const share = useShareEvent();
  const [sent, setSent] = useState<Set<string>>(new Set());

  // Недавние собеседники не из друзей тоже попадают в список (как в Instagram)
  const friendIds = new Set((friends.data ?? []).map((f) => f.id));
  const recent: Friend[] = (conversations.data ?? [])
    .filter((c) => c.canMessage && !friendIds.has(c.peer.id))
    .map((c) => ({ ...c.peer, important: false, messages30d: 0 }));
  const people = [...(friends.data ?? []), ...recent];

  const send = (userId: string) => {
    if (sent.has(userId)) return;
    share.mutate(
      {
        userId,
        attachment: { kind: 'event', eventId: event.id, title: event.title, startsAt: event.startsAt, venue: event.venue, coverUrl: event.coverUrl },
      },
      { onSuccess: () => setSent((s) => new Set(s).add(userId)) },
    );
  };

  return (
    <Sheet visible onClose={onClose} title={t.messages.shareTitle}>
      {people.length === 0 ? (
        <EmptyView title={t.people.noFriends} />
      ) : (
        <ScrollView style={styles.scroll}>
          <View style={{ paddingBottom: spacing.lg }}>
            <FriendList
              friends={people}
              onPick={send}
              trailing={(f) => <Icon icon={sent.has(f.id) ? Check : Send} size={18} color={sent.has(f.id) ? 'success' : 'textMuted'} />}
            />
          </View>
        </ScrollView>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({ scroll: { maxHeight: 520 } });
