import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import type { PersonRef } from '@/api/types';
import { spacing } from '@/theme/tokens';

import { Avatar } from './ui/avatar';
import { Text } from './ui/text';

/** Горизонтальный ряд людей (участники, друзья): тап — профиль. */
export function PeopleRow({ people }: { people: PersonRef[] }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {people.map((p) => (
        <Pressable
          key={p.id}
          accessibilityRole="link"
          onPress={() => router.push({ pathname: '/user/[id]', params: { id: p.id } })}
          style={styles.item}>
          <Avatar name={p.name} uri={p.avatarUrl} size={48} />
          <Text variant="label" numberOfLines={1} style={styles.name}>
            {p.name.split(' ')[0]}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.md },
  item: { alignItems: 'center', gap: 4, width: 60 },
  name: { maxWidth: 60, textAlign: 'center' },
});
