import { setAudioModeAsync } from 'expo-audio';
import { Flag, Trash2 } from 'lucide-react-native';
import { useEffect, useState, type ReactNode } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';

import type { OutgoingMessage } from '@/api/queries';
import type { MessageView } from '@/api/types';
import { formatDay, isSameDay } from '@/lib/format';
import { useAppSettings } from '@/state/app-settings';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { Sheet, SheetOption } from '../ui/sheet';
import { Text } from '../ui/text';
import { Composer } from './composer';
import { ImageViewer } from './image-viewer';
import { MessageBubble } from './message-bubble';

type Props = {
  messages: MessageView[];
  loading: boolean;
  meId: string;
  /** В групповом чате показываем имена авторов, в личке — нет */
  showAuthors: boolean;
  onSend: (m: OutgoingMessage, onError: () => void) => void;
  canDelete: (m: MessageView) => boolean;
  onDelete: (m: MessageView) => void;
  onReport: (m: MessageView) => void;
  onAuthorPress?: (userId: string) => void;
  /** Плашка над полем ввода (например, «Вы не в друзьях») */
  banner?: ReactNode;
};

// Лента сообщений + поле ввода: общая для чата сообщества и личных сообщений.
export function ChatThread({ messages, loading, meId, showAuthors, onSend, canDelete, onDelete, onReport, onAuthorPress, banner }: Props) {
  const { colors } = useTheme();
  const { t, lang } = useAppSettings();
  const [viewer, setViewer] = useState<string | null>(null);
  const [selected, setSelected] = useState<MessageView | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Голосовые должны звучать и при выключенном звуке на iPhone.
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        inverted
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          loading ? null : (
            // В перевёрнутом списке пустое состояние тоже переворачивается — возвращаем обратно.
            <View style={styles.emptyFlip}>
              <Text color="textMuted" style={styles.center}>
                {t.chat.empty}
              </Text>
            </View>
          )
        }
        renderItem={({ item, index }) => {
          const older = messages[index + 1];
          const newDay = !older || !isSameDay(older.createdAt, item.createdAt);
          return (
            <View>
              {newDay ? (
                <View style={styles.dayWrap}>
                  <View style={[styles.day, { backgroundColor: colors.surfaceAlt }]}>
                    <Text variant="label" color="textMuted">
                      {formatDay(item.createdAt, lang, t)}
                    </Text>
                  </View>
                </View>
              ) : null}
              <MessageBubble
                message={item}
                mine={item.authorId === meId}
                showAuthor={showAuthors && (newDay || older.authorId !== item.authorId)}
                onOpenImage={setViewer}
                onLongPress={() => !item.pending && setSelected(item)}
                onAuthorPress={onAuthorPress}
              />
            </View>
          );
        }}
      />
      {banner}
      {error ? (
        <Pressable onPress={() => setError(null)} style={[styles.error, { backgroundColor: colors.surfaceAlt }]}>
          <Text variant="caption" color="danger" style={styles.center}>
            {error}
          </Text>
        </Pressable>
      ) : null}
      <Composer
        onError={setError}
        onSend={(m) => {
          setError(null);
          onSend(m, () => setError(t.chat.sendError));
        }}
      />

      <Sheet visible={!!selected} onClose={() => setSelected(null)}>
        {selected && canDelete(selected) ? (
          <SheetOption
            icon={Trash2}
            label={t.chat.delete}
            onPress={() => {
              onDelete(selected);
              setSelected(null);
            }}
          />
        ) : null}
        {selected && selected.authorId !== meId ? (
          <SheetOption
            icon={Flag}
            label={t.common.report}
            onPress={() => {
              onReport(selected);
              setSelected(null);
              setError(t.common.reportSent);
            }}
          />
        ) : null}
      </Sheet>
      <ImageViewer url={viewer} onClose={() => setViewer(null)} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { paddingVertical: spacing.md, flexGrow: 1 },
  emptyFlip: { flex: 1, justifyContent: 'center', padding: spacing.xl, transform: [{ scaleY: -1 }] },
  dayWrap: { alignItems: 'center', marginVertical: spacing.md },
  day: { paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.pill },
  error: { padding: spacing.sm, marginHorizontal: spacing.md, borderRadius: radius.sm },
  center: { textAlign: 'center' },
});
