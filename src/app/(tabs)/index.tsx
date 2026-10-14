import { router } from 'expo-router';
import { ChevronRight, Crown, Plus } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { INTERESTS } from '@/api/interests';
import { useEvents, useMySubscription } from '@/api/queries';
import type { InterestId } from '@/api/types';
import { useMe } from '@/auth/auth-context';
import { CityPicker } from '@/components/city-picker';
import { INTEREST_ICONS } from '@/components/icons';
import { EventCard } from '@/components/event-card';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { Screen } from '@/components/ui/screen';
import { EmptyView, ErrorView, LoadingView } from '@/components/ui/state-view';
import { Text } from '@/components/ui/text';
import { PASS_PLAN } from '@/config/billing';
import { fill, formatKzt } from '@/lib/format';
import { useAppSettings } from '@/state/app-settings';
import { palette, radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

export default function EventsScreen() {
  const { colors } = useTheme();
  const me = useMe();
  const { cityId, lang, t } = useAppSettings();
  const [interest, setInterest] = useState<InterestId | 'all'>('all');
  const events = useEvents({ cityId });
  const sub = useMySubscription();
  const showPassBanner = sub.isSuccess && (!sub.data || sub.data.status === 'expired');

  // Чипы: только категории, по которым есть встречи; интересы пользователя — первыми.
  const chips = useMemo(() => {
    const present = new Set((events.data ?? []).map((e) => e.interestId));
    const rank = (id: InterestId) => (me.interests.includes(id) ? 0 : 1);
    return INTERESTS.filter((i) => present.has(i.id)).sort((a, b) => rank(a.id) - rank(b.id));
  }, [events.data, me.interests]);

  const list = (events.data ?? []).filter((e) => interest === 'all' || e.interestId === interest);

  return (
    <Screen
      tabBarInset
      refreshControl={
        <RefreshControl refreshing={events.isRefetching} onRefresh={events.refetch} tintColor={colors.text} />
      }>
      <View style={styles.header}>
        <View style={styles.row}>
          <CityPicker />
          <IconButton icon={Plus} label={t.create.title} onPress={() => router.push('/create')} />
        </View>
        <Text variant="h1">{t.events.greeting}</Text>
        {showPassBanner ? (
          <Pressable onPress={() => router.push('/subscription')} style={({ pressed }) => [styles.banner, { opacity: pressed ? 0.9 : 1 }]}>
            <Icon icon={Crown} size={20} tint={palette.ink} />
            <Text variant="bodyStrong" style={styles.bannerText}>
              {fill(t.pass.banner, { price: formatKzt(PASS_PLAN.priceKzt) })}
            </Text>
            <Icon icon={ChevronRight} size={18} tint={palette.ink} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chips}>
        <Chip label={t.events.all} active={interest === 'all'} onPress={() => setInterest('all')} />
        {chips.map((c) => (
          <Chip key={c.id} icon={INTEREST_ICONS[c.id]} label={c.name[lang]} active={interest === c.id} onPress={() => setInterest(c.id)} />
        ))}
      </ScrollView>

      {events.isError && !events.data ? (
        <ErrorView onRetry={events.refetch} />
      ) : events.isPending ? (
        <LoadingView />
      ) : list.length === 0 ? (
        <EmptyView title={t.events.empty} />
      ) : (
        <View style={styles.list}>
          {list.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xl },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  banner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: palette.yellow },
  bannerText: { flex: 1, color: palette.ink },
  chipsScroll: { marginHorizontal: -spacing.lg, flexGrow: 0 },
  chips: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  list: { gap: spacing.md },
});
