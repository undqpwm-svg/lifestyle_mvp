import { router } from 'expo-router';
import { View } from 'react-native';

import { useFriends, useOpenConversation } from '@/api/queries';
import { FriendList } from '@/components/friend-list';
import { Screen } from '@/components/ui/screen';
import { EmptyView, LoadingView } from '@/components/ui/state-view';
import { useAppSettings } from '@/state/app-settings';
import { spacing } from '@/theme/tokens';

// Новое сообщение: выбор друга (важные — первыми). Незнакомым пишут из их профиля.
export default function NewMessageScreen() {
  const { t } = useAppSettings();
  const friends = useFriends();
  const open = useOpenConversation();

  const start = (userId: string) =>
    open.mutate(userId, { onSuccess: (c) => router.replace({ pathname: '/messages/[id]', params: { id: c.id } }) });

  return (
    <Screen edges={['bottom']}>
      <View style={{ height: spacing.lg }} />
      {friends.isPending ? (
        <LoadingView />
      ) : !friends.data?.length ? (
        <EmptyView title={t.people.noFriends} />
      ) : (
        <FriendList friends={friends.data} onPick={start} />
      )}
    </Screen>
  );
}

