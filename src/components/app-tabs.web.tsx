import {
  TabList,
  Tabs,
  TabSlot,
  TabTrigger,
  type TabListProps,
  type TabTriggerSlotProps,
} from 'expo-router/ui';
import { CalendarDays, MessageCircle, User, Users } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { useAppSettings } from '@/state/app-settings';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { Icon, TicketIcon, type LucideIcon } from './ui/icon';
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
            <TabButton icon={CalendarDays} label={t.tabs.events} />
          </TabTrigger>
          <TabTrigger name="communities" href="/communities" asChild>
            <TabButton icon={Users} label={t.tabs.communities} />
          </TabTrigger>
          <TabTrigger name="messages" href="/messages" asChild>
            <TabButton icon={MessageCircle} label={t.tabs.messages} />
          </TabTrigger>
          <TabTrigger name="bookings" href="/bookings" asChild>
            <TabButton icon={TicketIcon} label={t.tabs.bookings} />
          </TabTrigger>
          <TabTrigger name="profile" href="/profile" asChild>
            <TabButton icon={User} label={t.tabs.profile} />
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

function TabButton({ icon, label, isFocused, ...props }: TabTriggerSlotProps & { icon: LucideIcon; label: string }) {
  const { colors } = useTheme();
  return (
    <Pressable {...props} style={[styles.btn, isFocused && { backgroundColor: colors.accent }]}>
      <Icon icon={icon} size={20} color={isFocused ? 'onAccent' : 'onInverse'} />
      <Text variant="label" color={isFocused ? 'onAccent' : 'onInverse'} numberOfLines={1} style={styles.label}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', bottom: spacing.lg, left: spacing.sm, right: spacing.sm, alignItems: 'center' },
  bar: { flexDirection: 'row', padding: 5, borderRadius: radius.pill, gap: 0, width: '100%', maxWidth: 480 },
  btn: { flexGrow: 1, flexBasis: 'auto', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4, borderRadius: radius.pill, gap: 2 },
  label: { fontSize: 10.5, lineHeight: 14, letterSpacing: 0 },
});
