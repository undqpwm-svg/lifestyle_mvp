import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Pause, Play } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { formatDuration } from '@/lib/format';
import { radius, spacing, type ThemeColors } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { Icon } from '../ui/icon';
import { Text } from '../ui/text';

const BARS = 28;

/** Псевдо-волна: стабильная для сообщения, без декодирования аудио на клиенте. */
function waveform(seed: string): number[] {
  let h = [...seed].reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) | 0, 7);
  return Array.from({ length: BARS }, () => {
    h = (h * 1103515245 + 12345) | 0;
    return 0.25 + (Math.abs(h) % 1000) / 1333;
  });
}

type Props = { id: string; url: string; durationMs: number; tone: 'mine' | 'theirs' };

export function VoicePlayer({ id, url, durationMs, tone }: Props) {
  const { colors } = useTheme();
  const player = useAudioPlayer(url ? { uri: url } : null);
  const status = useAudioPlayerStatus(player);
  const bars = useMemo(() => waveform(id), [id]);

  const total = status.duration > 0 ? status.duration * 1000 : durationMs;
  const progress = total > 0 ? Math.min(1, (status.currentTime * 1000) / total) : 0;
  const finished = status.didJustFinish || (total > 0 && status.currentTime * 1000 >= total - 50);

  const fg: keyof ThemeColors = tone === 'mine' ? 'onAccent' : 'text';
  const btnBg = tone === 'mine' ? colors.inverse : colors.accent;
  const btnFg: keyof ThemeColors = tone === 'mine' ? 'onInverse' : 'onAccent';

  const toggle = async () => {
    if (!url) return;
    if (status.playing) return player.pause();
    if (finished) await player.seekTo(0);
    player.play();
  };

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={status.playing ? 'pause' : 'play'}
        onPress={toggle}
        disabled={!url}
        style={[styles.btn, { backgroundColor: btnBg, opacity: url ? 1 : 0.4 }]}>
        <Icon icon={status.playing ? Pause : Play} size={16} color={btnFg} strokeWidth={2.4} />
      </Pressable>
      <View style={styles.wave}>
        {bars.map((v, i) => (
          <View
            key={i}
            style={[
              styles.bar,
              {
                height: 4 + v * 20,
                backgroundColor: colors[fg],
                opacity: i / BARS < progress ? 1 : 0.3,
              },
            ]}
          />
        ))}
      </View>
      <Text variant="label" color={fg} style={styles.time}>
        {formatDuration(status.playing || progress > 0 ? status.currentTime * 1000 : total)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minWidth: 220 },
  btn: { width: 34, height: 34, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  wave: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2, height: 26 },
  bar: { flex: 1, borderRadius: 2 },
  time: { minWidth: 34, textAlign: 'right' },
});
