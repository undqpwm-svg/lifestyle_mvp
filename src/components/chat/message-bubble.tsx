import { Image } from 'expo-image';
import { Clock, ImageOff } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { ChatMessage, ImageAttachment } from '@/api/types';
import { formatTime } from '@/lib/format';
import { useAppSettings } from '@/state/app-settings';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { Icon } from '../ui/icon';
import { Text } from '../ui/text';
import { VoicePlayer } from './voice-player';

const MAX_W = 260;

type Props = {
  message: ChatMessage;
  mine: boolean;
  /** Показывать имя автора (первое сообщение в серии от одного человека) */
  showAuthor: boolean;
  onOpenImage: (url: string) => void;
  onLongPress: () => void;
};

export function MessageBubble({ message, mine, showAuthor, onOpenImage, onLongPress }: Props) {
  const { colors } = useTheme();
  const { lang } = useAppSettings();
  const images = message.attachments.filter((a): a is ImageAttachment => a.kind === 'image');
  const voice = message.attachments.find((a) => a.kind === 'voice');
  const fg = mine ? 'onAccent' : 'text';
  const onlyImages = images.length > 0 && !message.text && !voice;

  return (
    <View style={[styles.row, mine ? styles.rowMine : styles.rowTheirs]}>
      <Pressable
        onLongPress={onLongPress}
        delayLongPress={350}
        style={[
          styles.bubble,
          mine ? { backgroundColor: colors.accent, borderBottomRightRadius: 6 } : { backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderBottomLeftRadius: 6 },
          onlyImages && styles.bubbleTight,
          message.pending && { opacity: 0.7 },
        ]}>
        {showAuthor && !mine ? (
          <Text variant="label" style={[styles.author, onlyImages && styles.authorPadded]}>
            {message.authorName}
          </Text>
        ) : null}

        {images.length > 0 ? <ImageGrid images={images} onOpen={onOpenImage} /> : null}
        {voice ? <VoicePlayer id={message.id} url={voice.url} durationMs={voice.durationMs} tone={mine ? 'mine' : 'theirs'} /> : null}
        {message.text ? (
          <Text color={fg} style={styles.text}>
            {message.text}
          </Text>
        ) : null}

        <View style={[styles.meta, onlyImages && styles.metaOverlay]}>
          {message.pending ? <Icon icon={Clock} size={11} color={fg} tint={onlyImages ? '#FFFFFF' : undefined} /> : null}
          <Text variant="label" color={fg} style={[styles.time, onlyImages && styles.timeOnPhoto]}>
            {formatTime(message.createdAt, lang)}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

function ImageGrid({ images, onOpen }: { images: ImageAttachment[]; onOpen: (url: string) => void }) {
  if (images.length === 1) {
    const img = images[0];
    const ratio = img.width && img.height ? Math.min(Math.max(img.width / img.height, 0.6), 1.6) : 4 / 3;
    return <ChatImage img={img} style={{ width: MAX_W - 8, aspectRatio: ratio }} onOpen={onOpen} />;
  }
  const cell = (MAX_W - 8 - 4) / 2;
  return (
    <View style={styles.grid}>
      {images.map((img, i) => (
        <ChatImage key={i} img={img} style={{ width: cell, height: cell }} onOpen={onOpen} />
      ))}
    </View>
  );
}

function ChatImage({ img, style, onOpen }: { img: ImageAttachment; style: object; onOpen: (url: string) => void }) {
  const { colors } = useTheme();
  const [failed, setFailed] = useState(!img.url);
  return (
    <Pressable disabled={failed} onPress={() => onOpen(img.url)} style={[styles.img, { backgroundColor: colors.surfaceAlt }, style]}>
      {failed ? (
        <View style={styles.imgFallback}>
          <Icon icon={ImageOff} size={28} color="textFaint" />
        </View>
      ) : (
        <Image source={{ uri: img.url }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} onError={() => setFailed(true)} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: spacing.md, marginVertical: 2, flexDirection: 'row' },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },
  bubble: { maxWidth: MAX_W + 24, borderRadius: 18, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: 6 },
  bubbleTight: { padding: 4 },
  author: { opacity: 0.75 },
  authorPadded: { paddingHorizontal: 8, paddingTop: 4 },
  text: { fontSize: 15, lineHeight: 21 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-end', marginTop: -2 },
  metaOverlay: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    marginTop: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  time: { fontSize: 11, lineHeight: 14, opacity: 0.7, letterSpacing: 0 },
  timeOnPhoto: { color: '#FFFFFF', opacity: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, width: MAX_W - 8 },
  img: { borderRadius: 14, overflow: 'hidden' },
  imgFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
