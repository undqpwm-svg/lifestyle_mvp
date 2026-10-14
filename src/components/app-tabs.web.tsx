import {
  TabList,
  Tabs,
  TabSlot,
  TabTrigger,
  type TabListProps,
  type TabTriggerSlotProps,
} from 'expo-router/ui';
import { Pressable, StyleSheet, View } from 'react-native';

import { useAppSettings } from '@/state/app-settings';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { Text } from './ui/text';

// Веб-версия таббара (для превью в браузере): плавающая «пилюля» снизу в стиле сайта.
export default function AppTabs() {
  const { t } = useAppSettings();

  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      {/* TabTrigger должны быть прямыми детьми TabList — иначе роутер не найдёт экраны */}
      <TabList asChild>
        <FloatingTabList>
          <TabTrigger name="index" href="/" asChild>
            <TabButton icon="📅" label={t.tabs.events} />
          </TabTrigger>
          <TabTrigger name="bookings" href="/bookings" asChild>
            <TabButton icon="🎟" label={t.tabs.bookings} />
          </TabTrigger>
          <TabTrigger name="profile" href="/profile" asChild>
            <TabButton icon="👤" label={t.tabs.profile} />
          </TabTrigger>
        </FloatingTabList>
      </TabList>
    </Tabs>
  );
}

function FloatingTabList({ children, style, ...props }: TabListProps) {
  const { colors } = useTheme();
  return (
    <View {...props} style={styles.wrap} pointerEvents="box-none">
      <View style={[styles.bar, { backgroundColor: colors.inverse }]}>{children}</View>
    </View>
  );
}

function TabButton({ icon, label, isFocused, ...props }: TabTriggerSlotProps & { icon: string; label: string }) {
  const { colors } = useTheme();
  return (
    <Pressable {...props} style={[styles.btn, isFocused && { backgroundColor: colors.accent }]}>
      <Text variant="caption" color={isFocused ? 'onAccent' : 'onInverse'}>
        {icon} {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', bottom: spacing.lg, left: 0, right: 0, alignItems: 'center' },
  bar: { flexDirection: 'row', padding: 6, borderRadius: radius.pill, gap: 4 },
  btn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.pill },
});
