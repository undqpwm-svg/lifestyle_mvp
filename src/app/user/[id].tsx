import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Ban, Check, Ellipsis, Flag, Lock, MessageCircle, UserMinus, UserPlus, Users } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { interestById } from '@/api/interests';
import { useFriendAction, useOpenConversation, useReport, useUserProfile } from '@/api/queries';
import { INTEREST_ICONS } from '@/components/icons';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { Section } from '@/components/ui/section';
import { Sheet, SheetOption } from '@/components/ui/sheet';
import { EmptyView, LoadingView } from '@/components/ui/state-view';
import { Text } from '@/components/ui/text';
import { getCity } from '@/config/cities';
import { formatEventDate } from '@/lib/format';
import { useAppSettings } from '@/state/app-settings';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

export default function UserScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { t, lang } = useAppSettings();
  const { data: p, isPending } = useUserProfile(id);
  const action = useFriendAction();
  const open = useOpenConversation();
  const report = useReport();
  const [menu, setMenu] = useState(false);

  if (isPending) return <Screen edges={['bottom']}><LoadingView /></Screen>;
  if (!p) return <Screen edges={['bottom']}><EmptyView title={t.people.notFound} /></Screen>;

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen
        options={{
          title: p.name,
          headerRight:
            p.friendship === 'self'
              ? undefined
              : () => (
                  <Pressable accessibilityRole="button" accessibilityLabel={t.people.more} hitSlop={10} onPress={() => setMenu(true)}>
                    <Icon icon={Ellipsis} size={22} />
                  </Pressable>
                ),
        }}
      />
      <View style={styles.head}>
        <Avatar name={p.name} uri={p.avatarUrl} size={88} />
        <Text variant="h2">{p.name}</Text>
        <Text color="textMuted">{getCity(p.cityId).name[lang]}</Text>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text variant="h3">{p.attendedCount}</Text>
            <Text variant="caption" color="textMuted">
              {t.people.attended}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text variant="h3">{p.friendsCount}</Text>
            <Text variant="caption" color="textMuted">
              {t.people.friendsCount}
            </Text>
          </View>
        </View>
      </View>

      {p.blocked ? (
        <View style={[styles.blocked, { backgroundColor: colors.surfaceAlt }]}>
          <Icon icon={Ban} size={18} color="textMuted" />
          <Text variant="caption" color="textMuted" style={{ flex: 1 }}>
            {t.people.blockedNote}
          </Text>
        </View>
      ) : p.friendship !== 'self' ? (
        <Button
          title={t.messages.write}
          icon={MessageCircle}
          variant="dark"
          style={{ marginBottom: spacing.md }}
          loading={open.isPending}
          onPress={() => open.mutate(p.id, { onSuccess: (c) => router.push({ pathname: '/messages/[id]', params: { id: c.id } }) })}
        />
      ) : null}

      {p.blocked ? (
        <Button title={t.people.unblock} variant="ghost" onPress={() => action.mutate({ userId: p.id, action: 'unblock' })} />
      ) : p.friendship === 'none' ? (
        <Button title={t.people.addFriend} icon={UserPlus} loading={action.isPending} onPress={() => action.mutate({ userId: p.id, action: 'request' })} />
      ) : p.friendship === 'outgoing' ? (
        <Button title={t.people.requestSent} variant="ghost" disabled />
      ) : p.friendship === 'incoming' ? (
        <View style={styles.actions}>
          <Button title={t.people.accept} style={{ flex: 1 }} onPress={() => action.mutate({ userId: p.id, action: 'accept' })} />
          <Button title={t.people.decline} variant="ghost" style={{ flex: 1 }} onPress={() => action.mutate({ userId: p.id, action: 'decline' })} />
        </View>
      ) : p.friendship === 'friends' ? (
        <Button title={t.people.isFriend} icon={Check} variant="ghost" disabled />
      ) : null}

      <View style={styles.tags}>
        {p.interests.map((i) => (
          <View key={i} style={[styles.tag, { borderColor: colors.line }]}>
            <Icon icon={INTEREST_ICONS[i]} size={14} />
            <Text variant="caption">{interestById.get(i)?.name[lang]}</Text>
          </View>
        ))}
      </View>

      <Section title={t.people.whereWas}>
        {p.recentEvents === null ? (
          <View style={styles.hidden}>
            <Icon icon={Lock} size={16} color="textMuted" />
            <Text color="textMuted">{t.people.hidden}</Text>
          </View>
        ) : p.recentEvents.length === 0 ? (
          <Text color="textMuted">—</Text>
        ) : (
          p.recentEvents.map((e) => (
            <Pressable key={e.id} onPress={() => router.push({ pathname: '/event/[id]', params: { id: e.id } })} style={[styles.row, { borderColor: colors.line }]}>
              <Text variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
                {e.title}
              </Text>
              <Text variant="caption" color="textMuted">
                {formatEventDate(e.startsAt, lang, t)}
              </Text>
            </Pressable>
          ))
        )}
      </Section>

      {p.communities.length > 0 ? (
        <Section title={t.people.communities}>
          {p.communities.map((c) => (
            <Pressable key={c.id} onPress={() => router.push({ pathname: '/community/[id]', params: { id: c.id } })} style={[styles.row, { borderColor: colors.line }]}>
              <Icon icon={Users} size={16} color="textMuted" />
              <Text variant="bodyStrong" style={{ flex: 1 }}>
                {c.name}
              </Text>
            </Pressable>
          ))}
        </Section>
      ) : null}
      <Sheet visible={menu} onClose={() => setMenu(false)}>
        {p.friendship === 'friends' ? (
          <SheetOption
            icon={UserMinus}
            label={t.people.remove}
            onPress={() => {
              action.mutate({ userId: p.id, action: 'remove' });
              setMenu(false);
            }}
          />
        ) : null}
        <SheetOption
          icon={Ban}
          label={p.blocked ? t.people.unblock : t.people.block}
          onPress={() => {
            action.mutate({ userId: p.id, action: p.blocked ? 'unblock' : 'block' });
            setMenu(false);
          }}
        />
        <SheetOption
          icon={Flag}
          label={t.common.report}
          onPress={() => {
            report.mutate({ target: 'user', targetId: p.id, reason: 'other' });
            setMenu(false);
          }}
        />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  stats: { flexDirection: 'row', gap: spacing.xxl, marginTop: spacing.sm },
  stat: { alignItems: 'center' },
  actions: { flexDirection: 'row', gap: spacing.md },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginVertical: spacing.xl },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6 },
  blocked: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: radius.md, marginBottom: spacing.md },
  hidden: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth },
});
