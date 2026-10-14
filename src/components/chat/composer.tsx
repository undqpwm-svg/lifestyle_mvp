import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Camera, ImageIcon, Mic, Paperclip, SendHorizontal, Trash2, X } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { OutgoingMessage } from '@/api/queries';
import { formatDuration } from '@/lib/format';
import { useAppSettings } from '@/state/app-settings';
import { fonts, palette, radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { Icon, type LucideIcon } from '../ui/icon';
import { Sheet, SheetOption } from '../ui/sheet';
import { Text } from '../ui/text';

const MAX_IMAGES = 6;
const MIN_VOICE_MS = 800;

type Props = { onSend: (m: OutgoingMessage) => void; onError: (text: string) => void };

// Поле ввода чата: текст, фото (галерея/камера) и голосовые.
// Если поле пустое — справа микрофон, если есть текст или фото — кнопка «Отправить».
export function Composer({ onSend, onError }: Props) {
  const { colors } = useTheme();
  const { t } = useAppSettings();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [images, setImages] = useState<OutgoingMessage['images']>([]);
  const [attachOpen, setAttachOpen] = useState(false);
  const [recording, setRecording] = useState(false);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recState = useAudioRecorderState(recorder, 200);

  const canSend = text.trim().length > 0 || images.length > 0;

  const send = () => {
    if (!canSend) return;
    onSend({ text, images });
    setText('');
    setImages([]);
  };

  const pick = async (source: 'gallery' | 'camera') => {
    setAttachOpen(false);
    const perm =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return onError(t.chat.photosDenied);
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      quality: 0.7,
      allowsMultipleSelection: source === 'gallery',
      selectionLimit: MAX_IMAGES - images.length,
    };
    const res = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (res.canceled) return;
    const picked = res.assets.map((a) => ({ uri: a.uri, kind: 'image' as const, mimeType: a.mimeType ?? 'image/jpeg', width: a.width, height: a.height }));
    setImages((prev) => [...prev, ...picked].slice(0, MAX_IMAGES));
  };

  const startRecording = async () => {
    const perm = await requestRecordingPermissionsAsync();
    if (!perm.granted) return onError(t.chat.micDenied);
    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setRecording(true);
    } catch {
      onError(t.chat.micDenied);
    }
  };

  const finishRecording = async (shouldSend: boolean) => {
    const durationMs = recState.durationMillis;
    await recorder.stop();
    setRecording(false);
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});
    if (!shouldSend) return;
    if (!recorder.uri || durationMs < MIN_VOICE_MS) return onError(t.chat.tooShort);
    onSend({
      text: '',
      images: [],
      voice: { uri: recorder.uri, kind: 'voice', mimeType: Platform.OS === 'web' ? 'audio/webm' : 'audio/m4a', durationMs },
    });
  };

  const barStyle = [styles.bar, { backgroundColor: colors.background, borderTopColor: colors.line, paddingBottom: Math.max(insets.bottom, spacing.sm) }];

  if (recording) {
    return (
      <View style={barStyle}>
        <View style={styles.row}>
          <RoundButton icon={Trash2} label={t.chat.cancel} onPress={() => finishRecording(false)} />
          <View style={[styles.recPill, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <View style={[styles.recDot, { backgroundColor: colors.danger }]} />
            <Text variant="bodyStrong">{t.chat.recording}</Text>
            <Text color="textMuted" style={styles.recTime}>
              {formatDuration(recState.durationMillis)}
            </Text>
          </View>
          <RoundButton icon={SendHorizontal} label={t.chat.send} filled onPress={() => finishRecording(true)} />
        </View>
      </View>
    );
  }

  return (
    <View style={barStyle}>
      {images.length > 0 ? (
        <View style={styles.previews}>
          {images.map((img, i) => (
            <View key={img.uri + i} style={styles.preview}>
              <Image source={{ uri: img.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
              <Pressable
                accessibilityLabel={t.chat.cancel}
                hitSlop={8}
                onPress={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                style={styles.previewRemove}>
                <Icon icon={X} size={12} tint={palette.cream} strokeWidth={3} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.row}>
        <RoundButton icon={Paperclip} label={t.chat.attach} ghost onPress={() => setAttachOpen(true)} />
        <View style={[styles.inputBox, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={t.chat.placeholder}
            placeholderTextColor={colors.textFaint}
            multiline
            maxLength={4000}
            style={[styles.input, { color: colors.text }]}
          />
        </View>
        {canSend ? (
          <RoundButton icon={SendHorizontal} label={t.chat.send} filled onPress={send} />
        ) : (
          <RoundButton icon={Mic} label={t.chat.voice} filled onPress={startRecording} />
        )}
      </View>

      <Sheet visible={attachOpen} onClose={() => setAttachOpen(false)} title={t.chat.attach}>
        <SheetOption icon={ImageIcon} label={t.chat.gallery} onPress={() => pick('gallery')} />
        <SheetOption icon={Camera} label={t.chat.camera} onPress={() => pick('camera')} />
      </Sheet>
    </View>
  );
}

function RoundButton({ icon, label, filled, ghost, onPress }: { icon: LucideIcon; label: string; filled?: boolean; ghost?: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.round,
        { backgroundColor: filled ? colors.accent : ghost ? 'transparent' : colors.surface, opacity: pressed ? 0.8 : 1 },
      ]}>
      <Icon icon={icon} size={20} color={filled ? 'onAccent' : 'text'} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: spacing.sm, paddingHorizontal: spacing.sm, gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs },
  round: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  inputBox: { flex: 1, minHeight: 44, maxHeight: 140, borderRadius: 22, borderWidth: 1, paddingHorizontal: spacing.md, justifyContent: 'center' },
  input: { fontFamily: fonts.body, fontSize: 16, paddingVertical: Platform.OS === 'ios' ? 11 : 8, outlineStyle: 'none' } as object,
  previews: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.xs },
  preview: { width: 64, height: 64, borderRadius: radius.sm, overflow: 'hidden' },
  previewRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recPill: { flex: 1, height: 44, borderRadius: 22, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg },
  recDot: { width: 10, height: 10, borderRadius: 5 },
  recTime: { marginLeft: 'auto', fontVariant: ['tabular-nums'] },
});
