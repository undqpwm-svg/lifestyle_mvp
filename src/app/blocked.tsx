import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { useBlocked, useFriendAction } from '@/api/queries';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { EmptyView, LoadingView } from '@/components/ui/state-view';
import { Text } from '@/components/ui/text';
import { useAppSettings } from '@/state/app-settings';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

export default function BlockedScreen() {
  const { colors } = useTheme();
  const { t } = useAppSettings();
  const blocked = useBlocked();
  const action = useFriendAction();

  return (
    <Screen edges={['bottom']}>
      {blocked.isPending ? (
        <LoadingView />
      ) : !blocked.data?.length ? (
        <EmptyView title={t.people.blockedEmpty} />
      ) : (
        <View style={[styles.list, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          {blocked.data.map((p, i) => (
            <View key={p.id} style={[styles.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line }]}>
              <Pressable style={styles.person} onPress={() => router.push({ pathname: '/user/[id]', params: { id: p.id } })}>
                <Avatar name={p.name} size={40} />
                <Text variant="bodyStrong" style={{ flex: 1 }}>
                  {p.name}
                </Text>
              </Pressable>
              <Button title={t.people.unblock} variant="ghost" style={styles.btn} onPress={() => action.mutate({ userId: p.id, action: 'unblock' })} />
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { marginTop: spacing.lg, borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  person: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  btn: { minHeight: 40, paddingHorizontal: spacing.md },
});
