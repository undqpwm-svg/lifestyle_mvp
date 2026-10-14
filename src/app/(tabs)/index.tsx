import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { INTERESTS } from '@/api/interests';
import { useEvents } from '@/api/queries';
import type { InterestId } from '@/api/types';
import { useMe } from '@/auth/auth-context';
import { CityPicker } from '@/components/city-picker';
import { INTEREST_ICONS } from '@/components/icons';
import { EventCard } from '@/components/event-card';
import { Chip } from '@/components/ui/chip';
import { IconButton } from '@/components/ui/icon-button';
import { Screen } from '@/components/ui/screen';
import { EmptyView, ErrorView, LoadingView } from '@/components/ui/state-view';
import { Text } from '@/components/ui/text';
import { useAppSettings } from '@/state/app-settings';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

export default function EventsScreen() {
  const { colors } = useTheme();
  const me = useMe();
  const { cityId, lang, t } = useAppSettings();
  const [interest, setInterest] = useState<InterestId | 'all'>('all');
  const events = useEvents({ cityId });

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
  chipsScroll: { marginHorizontal: -spacing.lg, flexGrow: 0 },
  chips: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  list: { gap: spacing.md },
});
