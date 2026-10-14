import { router } from 'expo-router';
import { CalendarDays, Store, Users } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { useAppSettings } from '@/state/app-settings';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

// Точка входа «+»: что создать.
export default function CreateScreen() {
  const { colors } = useTheme();
  const { t } = useAppSettings();
  const items = [
    { icon: CalendarDays, title: t.create.event, hint: t.create.eventHint, href: '/event/new' as const },
    { icon: Users, title: t.create.community, hint: t.create.communityHint, href: '/community/new' as const },
    { icon: Store, title: t.create.organization, hint: t.create.organizationHint, href: '/org/new' as const },
  ];
  return (
    <Screen edges={['bottom']}>
      <View style={styles.list}>
        {items.map((i) => (
          <Pressable
            key={i.href}
            onPress={() => router.replace(i.href)}
            style={({ pressed }) => [styles.item, { backgroundColor: colors.surface, borderColor: colors.line, opacity: pressed ? 0.85 : 1 }]}>
            <View style={[styles.icon, { backgroundColor: colors.accent }]}>
              <Icon icon={i.icon} size={24} color="onAccent" />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="h3">{i.title}</Text>
              <Text variant="caption" color="textMuted">
                {i.hint}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md, paddingTop: spacing.lg },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1 },
  icon: { width: 52, height: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});
