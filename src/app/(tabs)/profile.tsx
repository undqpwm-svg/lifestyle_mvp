import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { CityPicker } from '@/components/city-picker';
import { SettingsRow } from '@/components/settings-row';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { getCity } from '@/config/cities';
import { botStartLink, LEGAL_LINKS, ORGANIZER_CONTACT } from '@/config/links';
import { LANGS } from '@/i18n';
import { useAppSettings } from '@/state/app-settings';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { t, lang, setLang, cityId } = useAppSettings();
  const open = (url: string) => WebBrowser.openBrowserAsync(url);

  return (
    <Screen>
      <Text variant="h1" style={styles.title}>
        {t.profile.title}
      </Text>

      {/* Hero-блок входа: тёмная секция, как блок «Для организаторов» на сайте */}
      <View style={[styles.hero, { backgroundColor: colors.inverse }]}>
        <Text variant="h3" color="onInverse">
          LIFESTYLE
        </Text>
        <Text color="onInverse" style={{ opacity: 0.7 }}>
          {t.profile.loginHint}
        </Text>
        {/* TODO: Telegram Login — подпись данных проверяет бэкенд, клиент получает JWT. */}
        <Button title={t.profile.loginTelegram} onPress={() => Linking.openURL(botStartLink('app_login'))} />
      </View>

      <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.line }]}>
        <SettingsRow label={t.profile.city} right={<CityPicker />} />
        <SettingsRow
          label={t.profile.language}
          last
          right={
            <View style={[styles.segment, { backgroundColor: colors.surfaceAlt }]}>
              {LANGS.map((l) => (
                <Pressable
                  key={l.id}
                  onPress={() => setLang(l.id)}
                  style={[styles.segBtn, lang === l.id && { backgroundColor: colors.inverse }]}>
                  <Text variant="label" color={lang === l.id ? 'onInverse' : 'textMuted'}>
                    {l.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          }
        />
      </View>

      <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.line }]}>
        <SettingsRow label={t.profile.community} onPress={() => Linking.openURL(getCity(cityId).community)} />
        <SettingsRow label={t.profile.organizer} onPress={() => Linking.openURL(ORGANIZER_CONTACT)} last />
      </View>

      <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.line }]}>
        <SettingsRow label={t.profile.offer} onPress={() => open(LEGAL_LINKS.offer)} />
        <SettingsRow label={t.profile.terms} onPress={() => open(LEGAL_LINKS.terms)} />
        <SettingsRow label={t.profile.privacy} onPress={() => open(LEGAL_LINKS.privacy)} last />
      </View>

      <Text variant="caption" color="textFaint" style={styles.version}>
        {t.profile.version} {Constants.expoConfig?.version ?? '—'}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { paddingTop: spacing.lg, paddingBottom: spacing.xl },
  hero: { borderRadius: radius.lg, padding: spacing.xl, gap: spacing.md, marginBottom: spacing.lg },
  group: { borderRadius: radius.lg, borderWidth: 1, marginBottom: spacing.lg, overflow: 'hidden' },
  segment: { flexDirection: 'row', borderRadius: radius.pill, padding: 3 },
  segBtn: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill },
  version: { textAlign: 'center', marginTop: spacing.sm },
});
