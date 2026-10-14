import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { INTERESTS } from '@/api/interests';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Segmented } from '@/components/ui/segmented';
import { Text } from '@/components/ui/text';
import { LEGAL_LINKS } from '@/config/links';
import { LANGS } from '@/i18n';
import { useAppSettings } from '@/state/app-settings';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

export default function WelcomeScreen() {
  const { colors } = useTheme();
  const { t, lang, setLang } = useAppSettings();
  const [tgNote, setTgNote] = useState(false);

  return (
    <Screen background="inverse" edges={['top', 'bottom']}>
      <View style={styles.top}>
        <Segmented options={LANGS} value={lang} onChange={setLang} />
      </View>

      <View style={styles.hero}>
        <View style={[styles.logo, { backgroundColor: colors.accent }]}>
          <Text variant="h1" color="onAccent">
            L
          </Text>
        </View>
        <Text variant="h1" color="onInverse" style={styles.brand}>
          LIFESTYLE
        </Text>
        <Text color="onInverse" style={styles.tagline}>
          {t.auth.tagline}
        </Text>
        <View style={styles.cloud}>
          {INTERESTS.slice(0, 9).map((i) => (
            <View key={i.id} style={[styles.tag, { borderColor: 'rgba(255,255,255,0.18)' }]}>
              <Text variant="caption" color="onInverse">
                {i.emoji} {i.name[lang]}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.actions}>
        <Button title={t.auth.start} onPress={() => router.push('/phone')} />
        <Button title={t.auth.telegram} variant="dark" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} onPress={() => setTgNote(true)} />
        {tgNote ? (
          <Text variant="caption" color="onInverse" style={styles.note}>
            {t.auth.telegramSoon}
          </Text>
        ) : null}
        <Text variant="caption" color="onInverse" style={[styles.note, { opacity: 0.5 }]} onPress={() => WebBrowser.openBrowserAsync(LEGAL_LINKS.offer)}>
          {t.auth.terms}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { alignItems: 'flex-end', paddingTop: spacing.md },
  hero: { flex: 1, justifyContent: 'center', gap: spacing.lg, paddingVertical: spacing.xxl },
  logo: { width: 64, height: 64, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  brand: { fontSize: 40, lineHeight: 44 },
  tagline: { fontSize: 18, lineHeight: 26, opacity: 0.8 },
  cloud: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  tag: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6 },
  actions: { gap: spacing.md, paddingBottom: spacing.lg },
  note: { textAlign: 'center', opacity: 0.75 },
});
