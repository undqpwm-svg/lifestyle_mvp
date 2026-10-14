import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/use-theme';

import { Icon, type LucideIcon } from './icon';

type Props = {
  uri?: string;
  /** Иконка заглушки, если фото нет или оно не загрузилось */
  fallbackIcon: LucideIcon;
  style?: ViewStyle;
  radius?: number;
  iconSize?: number;
  children?: React.ReactNode;
};

// Фото-обложка с фирменной заглушкой: жёлтая подложка и контурная иконка категории.
export function Cover({ uri, fallbackIcon, style, radius = 0, iconSize = 40, children }: Props) {
  const { colors } = useTheme();
  const [failed, setFailed] = useState(false);
  const showImage = !!uri && !failed;

  return (
    <View style={[styles.box, { borderRadius: radius, backgroundColor: colors.accentSoft }, style]}>
      <View style={styles.fallback}>
        <Icon icon={fallbackIcon} size={iconSize} color="onAccent" strokeWidth={1.5} />
      </View>
      {showImage ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
          onError={() => setFailed(true)}
        />
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { overflow: 'hidden' },
  fallback: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', opacity: 0.55 },
});
