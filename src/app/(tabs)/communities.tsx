import { router } from 'expo-router';
import { Plus, Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { INTERESTS } from '@/api/interests';
import { useCommunities } from '@/api/queries';
import type { InterestId } from '@/api/types';
import { useMe } from '@/auth/auth-context';
import { CommunityCard } from '@/components/community-card';
import { INTEREST_ICONS } from '@/components/icons';
import { Chip } from '@/components/ui/chip';
import { IconButton } from '@/components/ui/icon-button';
import { Screen } from '@/components/ui/screen';
import { Section } from '@/components/ui/section';
import { EmptyView, ErrorView, LoadingView } from '@/components/ui/state-view';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { useAppSettings } from '@/state/app-settings';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

export default function CommunitiesScreen() {
  const { colors } = useTheme();
  const me = useMe();
  const { cityId, lang, t } = useAppSettings();
  const [query, setQuery] = useState('');
  const [interest, setInterest] = useState<InterestId | undefined>();
  const list = useCommunities({ cityId, interestId: interest, query: query.trim() || undefined });

  const { mine, other } = useMemo(() => {
    const all = list.data ?? [];
    // Рекомендации: сначала по пересечению с интересами пользователя, потом по размеру.
    const score = (ids: InterestId[]) => ids.filter((i) => me.interests.includes(i)).length;
    return {
      mine: all.filter((c) => c.myRole),
      other: all.filter((c) => !c.myRole).sort((a, b) => score(b.interests) - score(a.interests)),
    };
  }, [list.data, me.interests]);

  const chips = useMemo(() => {
    const rank = (id: InterestId) => (me.interests.includes(id) ? 0 : 1);
    return [...INTERESTS].sort((a, b) => rank(a.id) - rank(b.id));
  }, [me.interests]);

  return (
    <Screen tabBarInset refreshControl={<RefreshControl refreshing={list.isRefetching} onRefresh={list.refetch} tintColor={colors.text} />}>
      <View style={styles.header}>
        <View style={styles.row}>
          <Text variant="h1">{t.communities.title}</Text>
          <IconButton icon={Plus} label={t.communities.create} onPress={() => router.push('/community/new')} />
        </View>
        <TextField icon={Search} placeholder={t.communities.search} value={query} onChangeText={setQuery} returnKeyType="search" />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chips}>
        {chips.map((c) => (
          <Chip
            key={c.id}
            icon={INTEREST_ICONS[c.id]}
            label={c.name[lang]}
            active={interest === c.id}
            onPress={() => setInterest(interest === c.id ? undefined : c.id)}
          />
        ))}
      </ScrollView>

      {list.isError && !list.data ? (
        <ErrorView onRetry={list.refetch} />
      ) : list.isPending ? (
        <LoadingView />
      ) : mine.length + other.length === 0 ? (
        <EmptyView title={t.communities.empty} />
      ) : (
        <>
          {mine.length > 0 ? (
            <Section title={t.communities.mine}>
              {mine.map((c) => (
                <CommunityCard key={c.id} community={c} />
              ))}
            </Section>
          ) : null}
          {other.length > 0 ? (
            <Section title={t.communities.discover}>
              {other.map((c) => (
                <CommunityCard key={c.id} community={c} />
              ))}
            </Section>
          ) : null}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.lg },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chipsScroll: { marginHorizontal: -spacing.lg, flexGrow: 0 },
  chips: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
});
