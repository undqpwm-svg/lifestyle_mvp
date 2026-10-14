import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Send, Users } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Cover } from '@/components/ui/cover';
import { Icon, type LucideIcon } from '@/components/ui/icon';
import { Segmented } from '@/components/ui/segmented';
import { Text } from '@/components/ui/text';
import { LEGAL_LINKS } from '@/config/links';
import { LANGS } from '@/i18n';
import { pexels, WELCOME_PHOTO } from '@/lib/media';
import { useAppSettings } from '@/state/app-settings';
import { fonts, palette, radius, spacing } from '@/theme/tokens';

// Экран приветствия в фирменных цветах сайта: фото людей сверху, жёлтая панель снизу.
// Цвета зафиксированы (не зависят от тёмной темы) — это «обложка» бренда.
export default function WelcomeScreen() {
  const { t, lang, setLang } = useAppSettings();
  const [tgNote, setTgNote] = useState(false);

  return (
    <View style={styles.root}>
      <Cover uri={pexels(WELCOME_PHOTO, 1200)} fallbackIcon={Users} style={styles.photo} iconSize={64}>
        <SafeAreaView edges={['top']} style={styles.topBar}>
          <View style={styles.wordmark}>
            <Text style={styles.wordmarkText}>LIFESTYLE</Text>
          </View>
          <Segmented options={LANGS} value={lang} onChange={setLang} />
        </SafeAreaView>
      </Cover>

      <SafeAreaView edges={['bottom']} style={styles.panel}>
        <View style={styles.inner}>
          <Text style={styles.headline}>{t.events.greeting}</Text>
          <Text style={styles.tagline}>{t.auth.tagline}</Text>

          <View style={styles.actions}>
            <WelcomeButton title={t.auth.start} filled onPress={() => router.push('/phone')} />
            <WelcomeButton title={t.auth.telegram} icon={Send} onPress={() => setTgNote(true)} />
            {tgNote ? <Text style={styles.note}>{t.auth.telegramSoon}</Text> : null}
            <Text style={[styles.note, styles.terms]} onPress={() => WebBrowser.openBrowserAsync(LEGAL_LINKS.offer)}>
              {t.auth.terms}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function WelcomeButton({ title, icon, filled, onPress }: { title: string; icon?: LucideIcon; filled?: boolean; onPress: () => void }) {
  const fg = filled ? palette.cream : palette.ink;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.btn, filled ? styles.btnFilled : styles.btnOutline, { opacity: pressed ? 0.85 : 1 }]}>
      {icon ? <Icon icon={icon} size={18} tint={fg} /> : null}
      <Text variant="bodyStrong" style={{ color: fg }}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.yellow },
  photo: { flex: 1, minHeight: 240 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  wordmark: { backgroundColor: palette.yellow, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.sm },
  wordmarkText: { fontFamily: fonts.display, fontSize: 15, letterSpacing: 1.5, color: palette.ink },
  panel: { backgroundColor: palette.yellow },
  inner: { width: '100%', maxWidth: 640, alignSelf: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.xl, gap: spacing.md },
  headline: { fontFamily: fonts.display, fontSize: 36, lineHeight: 40, letterSpacing: -1.2, color: palette.ink },
  tagline: { fontFamily: fonts.body, fontSize: 16, lineHeight: 23, color: palette.ink, opacity: 0.72 },
  actions: { gap: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.lg },
  btn: { minHeight: 54, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  btnFilled: { backgroundColor: palette.ink },
  btnOutline: { borderWidth: 1.5, borderColor: palette.ink },
  note: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: palette.ink, textAlign: 'center', opacity: 0.75 },
  terms: { opacity: 0.55 },
});
