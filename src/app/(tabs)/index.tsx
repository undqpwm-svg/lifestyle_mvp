import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { api } from '@/api/client';
import type { CategoryId } from '@/api/types';
import { useQuery } from '@/api/use-query';
import { CityPicker } from '@/components/city-picker';
import { EventCard } from '@/components/event-card';
import { Chip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { EmptyView, ErrorView, LoadingView } from '@/components/ui/state-view';
import { Text } from '@/components/ui/text';
import { useAppSettings } from '@/state/app-settings';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

export default function EventsScreen() {
  const { colors } = useTheme();
  const { cityId, lang, t } = useAppSettings();
  const [category, setCategory] = useState<CategoryId | 'all'>('all');

  const categories = useQuery(() => api.categories(), []);
  const events = useQuery(() => api.events(cityId), [cityId]);

  const byId = useMemo(
    () => new Map((categories.data ?? []).map((c) => [c.id, c])),
    [categories.data],
  );
  // Показываем только категории, по которым в городе есть встречи.
  const available = useMemo(() => {
    const ids = new Set((events.data ?? []).map((e) => e.categoryId));
    return (categories.data ?? []).filter((c) => ids.has(c.id));
  }, [categories.data, events.data]);
  const list = (events.data ?? []).filter((e) => category === 'all' || e.categoryId === category);

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={events.loading && !!events.data}
          onRefresh={events.reload}
          tintColor={colors.text}
        />
      }>
      <View style={styles.header}>
        <CityPicker />
        <Text variant="h1">{t.events.greeting}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chips}>
        <Chip label={t.events.all} active={category === 'all'} onPress={() => setCategory('all')} />
        {available.map((c) => (
          <Chip
            key={c.id}
            label={`${c.emoji} ${c.name[lang]}`}
            active={category === c.id}
            onPress={() => setCategory(c.id)}
          />
        ))}
      </ScrollView>

      {events.error && !events.data ? (
        <ErrorView onRetry={events.reload} />
      ) : !events.data ? (
        <LoadingView />
      ) : list.length === 0 ? (
        <EmptyView title={t.events.empty} />
      ) : (
        <View style={styles.list}>
          {list.map((e) => (
            <EventCard key={e.id} event={e} category={byId.get(e.categoryId)} />
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xl },
  // Чипы выходят за поля экрана, чтобы скролл был «от края до края».
  chipsScroll: { marginHorizontal: -spacing.lg, flexGrow: 0 },
  chips: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  list: { gap: spacing.md },
});
