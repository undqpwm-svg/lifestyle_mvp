import { setAudioModeAsync } from 'expo-audio';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Flag, Trash2, Users } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCommunity, useDeleteMessage, useJoinCommunity, useMessages, useReport, useSendMessage } from '@/api/queries';
import type { ChatMessage } from '@/api/types';
import { useMe } from '@/auth/auth-context';
import { Composer } from '@/components/chat/composer';
import { ImageViewer } from '@/components/chat/image-viewer';
import { MessageBubble } from '@/components/chat/message-bubble';
import { communityCover } from '@/components/community-card';
import { INTEREST_ICONS } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Cover } from '@/components/ui/cover';
import { Icon } from '@/components/ui/icon';
import { Sheet, SheetOption } from '@/components/ui/sheet';
import { EmptyView, LoadingView } from '@/components/ui/state-view';
import { Text } from '@/components/ui/text';
import { formatDay, isSameDay } from '@/lib/format';
import { useAppSettings } from '@/state/app-settings';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

export default function CommunityChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { t, lang } = useAppSettings();
  const me = useMe();
  const community = useCommunity(id);
  const c = community.data;
  const isMember = !!c?.myRole;
  const canModerate = c?.myRole === 'owner' || c?.myRole === 'moderator';
  const messages = useMessages(id, isMember);
  const send = useSendMessage(id);
  const remove = useDeleteMessage(id);
  const join = useJoinCommunity();
  const report = useReport();
  const [viewer, setViewer] = useState<string | null>(null);
  const [selected, setSelected] = useState<ChatMessage | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Голосовые должны звучать и при выключенном звуке на iPhone.
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  const back = () => (router.canGoBack() ? router.back() : router.replace({ pathname: '/community/[id]', params: { id } }));
  const list = messages.data ?? [];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={[styles.header, { borderBottomColor: colors.line, backgroundColor: colors.background }]}>
        <Pressable accessibilityRole="button" onPress={back} hitSlop={10} style={styles.back}>
          <Icon icon={ArrowLeft} size={22} />
        </Pressable>
        {c ? (
          <Pressable style={styles.headerInfo} onPress={back}>
            <Cover
              uri={communityCover(c, 160)}
              fallbackIcon={c.interests[0] ? INTEREST_ICONS[c.interests[0]] : Users}
              radius={radius.sm}
              iconSize={18}
              style={styles.thumb}
            />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong" numberOfLines={1}>
                {c.name}
              </Text>
              <Text variant="caption" color="textMuted">
                {c.membersCount} {t.chat.members}
              </Text>
            </View>
          </Pressable>
        ) : null}
      </SafeAreaView>

      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {community.isPending ? (
          <LoadingView />
        ) : !isMember ? (
          <View style={styles.gate}>
            <EmptyView
              title={t.chat.membersOnly}
              hint={t.chat.membersOnlyHint}
              action={<Button title={t.chat.join} loading={join.isPending} onPress={() => join.mutate({ id, join: true })} />}
            />
          </View>
        ) : (
          <>
            <FlatList
              inverted
              data={list}
              keyExtractor={(m) => m.id}
              contentContainerStyle={styles.list}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                messages.isPending ? null : (
                  // В перевёрнутом списке пустое состояние тоже переворачивается — возвращаем обратно.
                  <View style={styles.emptyFlip}>
                    <Text color="textMuted" style={styles.center}>
                      {t.chat.empty}
                    </Text>
                  </View>
                )
              }
              renderItem={({ item, index }) => {
                const older = list[index + 1];
                const newDay = !older || !isSameDay(older.createdAt, item.createdAt);
                const showAuthor = newDay || older.authorId !== item.authorId;
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
                      mine={item.authorId === me.id}
                      showAuthor={showAuthor}
                      onOpenImage={setViewer}
                      onLongPress={() => !item.pending && setSelected(item)}
                    />
                  </View>
                );
              }}
            />
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
                send.mutate(m, { onError: () => setError(t.chat.sendError) });
              }}
            />
          </>
        )}
      </KeyboardAvoidingView>

      <Sheet visible={!!selected} onClose={() => setSelected(null)}>
        {selected && (selected.authorId === me.id || canModerate) ? (
          <SheetOption
            icon={Trash2}
            label={t.chat.delete}
            onPress={() => {
              remove.mutate(selected.id);
              setSelected(null);
            }}
          />
        ) : null}
        {selected && selected.authorId !== me.id ? (
          <SheetOption
            icon={Flag}
            label={t.common.report}
            onPress={() => {
              report.mutate({ target: 'message', targetId: selected.id, reason: 'other' });
              setSelected(null);
              setError(t.common.reportSent);
            }}
          />
        ) : null}
      </Sheet>
      <ImageViewer url={viewer} onClose={() => setViewer(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  back: { width: 36, height: 44, justifyContent: 'center' },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingTop: spacing.sm },
  thumb: { width: 40, height: 40 },
  list: { paddingVertical: spacing.md, flexGrow: 1 },
  emptyFlip: { flex: 1, justifyContent: 'center', padding: spacing.xl, transform: [{ scaleY: -1 }] },
  gate: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl },
  dayWrap: { alignItems: 'center', marginVertical: spacing.md },
  day: { paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.pill },
  error: { padding: spacing.sm, marginHorizontal: spacing.md, borderRadius: radius.sm },
  center: { textAlign: 'center' },
});
