import { StyleSheet, View } from 'react-native';

import { palette } from '@/theme/tokens';

import { Text } from './text';

// Аватар-заглушка: инициалы на цветном фоне. Цвет стабилен для одного и того же имени.
const BG = [palette.yellow, palette.yellowSoft, palette.sandDark, '#CDE7D8', '#D7E3FC', '#F7D6E0'];

export function Avatar({ name, size = 44, emoji }: { name: string; size?: number; emoji?: string }) {
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('') || '?';
  const hash = [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0);
  return (
    <View style={[styles.box, { width: size, height: size, borderRadius: size / 2, backgroundColor: BG[Math.abs(hash) % BG.length] }]}>
      <Text variant="label" style={{ color: palette.ink, fontSize: emoji ? size * 0.45 : size * 0.36 }}>
        {emoji ?? initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({ box: { alignItems: 'center', justifyContent: 'center' } });
