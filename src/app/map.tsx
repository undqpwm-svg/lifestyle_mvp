import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useEvents } from '@/api/queries';
import { CityPicker } from '@/components/city-picker';
import { EventMiniCard } from '@/components/event-mini-card';
import { INTEREST_ICONS } from '@/components/icons';
import { TileMap } from '@/components/map/tile-map';
import { Text } from '@/components/ui/text';
import { getCity } from '@/config/cities';
import { useAppSettings } from '@/state/app-settings';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

export default function MapScreen() {
  const { colors } = useTheme();
  const { cityId, t } = useAppSettings();
  const insets = useSafeAreaInsets();
  const events = useEvents({ cityId });
  const [selected, setSelected] = useState<string | null>(null);
  const list = events.data ?? [];
  const current = list.find((e) => e.id === selected) ?? null;

  return (
    <View style={styles.root}>
      {/* key: при смене города карта пересоздаётся с новым центром */}
      <TileMap
        key={cityId}
        center={getCity(cityId).center}
        attribution={t.map.attribution}
        pins={list.map((e) => ({ id: e.id, point: e.location, icon: INTEREST_ICONS[e.interestId], active: e.id === selected }))}
        onPinPress={setSelected}
      />
      <View style={[styles.top, { top: spacing.md }]} pointerEvents="box-none">
        <CityPicker />
      </View>
      {events.isSuccess && list.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: colors.surface }]}>
          <Text color="textMuted">{t.map.empty}</Text>
        </View>
      ) : null}
      {current ? (
        <View style={[styles.card, { bottom: insets.bottom + spacing.lg }]}>
          <EventMiniCard event={current} width="100%" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  top: { position: 'absolute', left: spacing.md },
  card: { position: 'absolute', left: spacing.lg, right: spacing.lg, maxWidth: 480, alignSelf: 'center' },
  empty: { position: 'absolute', alignSelf: 'center', top: '45%', padding: spacing.lg, borderRadius: radius.md },
});
