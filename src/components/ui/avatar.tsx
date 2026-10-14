import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { palette } from '@/theme/tokens';

import { Text } from './text';

// Аватар человека: фото, если есть, иначе инициалы на тёплом фоне (цвет стабилен для имени).
const BG = [palette.yellow, palette.yellowSoft, palette.sandDark, '#CDE7D8', '#D7E3FC', '#F7D6E0'];

export function Avatar({ name, size = 44, uri }: { name: string; size?: number; uri?: string }) {
  const [failed, setFailed] = useState(false);
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('') || '?';
  const hash = [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0);
  const box = { width: size, height: size, borderRadius: size / 2 };
  return (
    <View style={[styles.box, box, { backgroundColor: BG[Math.abs(hash) % BG.length] }]}>
      {uri && !failed ? (
        <Image source={{ uri }} style={[StyleSheet.absoluteFill, box]} contentFit="cover" transition={150} onError={() => setFailed(true)} />
      ) : (
        <Text variant="label" style={{ color: palette.ink, fontSize: size * 0.36, lineHeight: size * 0.44 }}>
          {initials}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({ box: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' } });
