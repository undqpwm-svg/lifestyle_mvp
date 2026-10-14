import { router, type Href } from 'expo-router';
import { Bell, CalendarCheck, Clock, Gift, Hourglass, MessageCircle, Sparkles, Star, UserPlus, Users } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useMarkNotificationsRead, useNotifications } from '@/api/queries';
import type { AppNotification, NotificationType } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Icon, type LucideIcon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { EmptyView, LoadingView } from '@/components/ui/state-view';
import { Text } from '@/components/ui/text';
import { fill, formatEventDate, formatRelative } from '@/lib/format';
import { enablePush, pushSupported } from '@/lib/push';
import { useAppSettings } from '@/state/app-settings';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

const ICONS: Record<NotificationType, LucideIcon> = {
  welcome: Sparkles,
  booking_confirmed: CalendarCheck,
  reminder: Clock,
  waitlist_offer: Hourglass,
  chat_message: MessageCircle,
  review_request: Star,
  friend_request: UserPlus,
  friend_accepted: Users,
  new_event: Bell,
  referral_bonus: Gift,
  direct_message: MessageCircle,
};

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const { t, lang } = useAppSettings();
  const list = useNotifications();
  const markRead = useMarkNotificationsRead();
  const [pushOn, setPushOn] = useState(false);
  const hasUnread = (list.data ?? []).some((n) => !n.readAt);

  // Открыли список — всё прочитано (отметка уходит на сервер один раз).
  useEffect(() => {
    if (hasUnread && !markRead.isPending) markRead.mutate();
  }, [hasUnread, markRead]);

  const text = (n: AppNotification) => {
    const key = n.type === 'waitlist_offer' && n.params.paid ? 'waitlist_offer_paid' : n.type;
    const params = { ...n.params, time: n.params.time ? formatEventDate(n.params.time, lang, t) : '' };
    return fill(t.notifications.types[key], params);
  };

  return (
    <Screen edges={['bottom']}>
      {pushSupported && !pushOn ? (
        <View style={[styles.push, { backgroundColor: colors.accentSoft }]}>
          <Text variant="bodyStrong">{t.notifications.enablePush}</Text>
          <Text variant="caption" color="textMuted">
            {t.notifications.pushHint}
          </Text>
          <Button title={t.notifications.enablePush} icon={Bell} variant="dark" onPress={() => enablePush().then(setPushOn)} />
        </View>
      ) : null}

      {list.isPending ? (
        <LoadingView />
      ) : !list.data?.length ? (
        <EmptyView title={t.notifications.empty} />
      ) : (
        <View style={styles.list}>
          {list.data.map((n) => (
            <Pressable
              key={n.id}
              disabled={!n.link}
              onPress={() => n.link && router.push({ pathname: n.link.pathname, params: n.link.params } as Href)}
              style={({ pressed }) => [
                styles.item,
                { backgroundColor: n.readAt ? colors.surface : colors.accentSoft, borderColor: colors.line, opacity: pressed ? 0.85 : 1 },
              ]}>
              <View style={[styles.icon, { backgroundColor: colors.background }]}>
                <Icon icon={ICONS[n.type]} size={20} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text>{text(n)}</Text>
                <Text variant="caption" color="textFaint">
                  {formatRelative(n.createdAt, lang)}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  push: { padding: spacing.lg, borderRadius: radius.lg, gap: spacing.sm, marginTop: spacing.lg },
  list: { gap: spacing.sm, paddingTop: spacing.lg },
  item: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, alignItems: 'flex-start' },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
