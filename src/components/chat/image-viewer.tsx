import { Image } from 'expo-image';
import { X } from 'lucide-react-native';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { palette, spacing } from '@/theme/tokens';

import { Icon } from '../ui/icon';

// Полноэкранный просмотр фото из чата.
export function ImageViewer({ url, onClose }: { url: string | null; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={!!url} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        {url ? <Image source={{ uri: url }} style={StyleSheet.absoluteFill} contentFit="contain" /> : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="close"
          onPress={onClose}
          hitSlop={12}
          style={[styles.close, { top: insets.top + spacing.md }]}>
          <Icon icon={X} size={24} tint={palette.cream} />
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  close: {
    position: 'absolute',
    right: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
