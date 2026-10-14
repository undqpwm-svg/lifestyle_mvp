import { router } from 'expo-router';
import { View } from 'react-native';

import { useFriends } from '@/api/queries';
import { FriendList } from '@/components/friend-list';
import { Screen } from '@/components/ui/screen';
import { EmptyView, LoadingView } from '@/components/ui/state-view';
import { useAppSettings } from '@/state/app-settings';
import { spacing } from '@/theme/tokens';

export default function FriendsScreen() {
  const { t } = useAppSettings();
  const friends = useFriends();

  return (
    <Screen edges={['bottom']}>
      <View style={{ height: spacing.lg }} />
      {friends.isPending ? (
        <LoadingView />
      ) : !friends.data?.length ? (
        <EmptyView title={t.people.noFriends} />
      ) : (
        <FriendList friends={friends.data} onPick={(id) => router.push({ pathname: '/user/[id]', params: { id } })} />
      )}
    </Screen>
  );
}
