import { BadgeCheck, Store, Users } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import type { HostRef } from '@/api/types';

import { Icon } from './ui/icon';
import { Text, type TextVariantProps } from './ui/text';

// «Кто проводит»: иконка типа (организация / сообщество), имя и отметка проверки.
export function HostLabel({ host, variant = 'caption', color = 'textMuted' }: { host: Pick<HostRef, 'type' | 'name' | 'verified'> } & TextVariantProps) {
  return (
    <View style={styles.row}>
      <Icon icon={host.type === 'community' ? Users : Store} size={15} color={color} />
      <Text variant={variant} color={color} numberOfLines={1} style={styles.name}>
        {host.name}
      </Text>
      {host.verified ? <Icon icon={BadgeCheck} size={15} color="text" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  name: { flexShrink: 1 },
});
