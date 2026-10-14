import Constants from 'expo-constants';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { StyleSheet, View } from 'react-native';

import { interestById } from '@/api/interests';
import { useMyCommunities, useMyOrganizations } from '@/api/queries';
import { useAuth, useMe } from '@/auth/auth-context';
import { CityPicker } from '@/components/city-picker';
import { SettingsRow } from '@/components/settings-row';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Segmented } from '@/components/ui/segmented';
import { Text } from '@/components/ui/text';
import { getCity } from '@/config/cities';
import { LEGAL_LINKS } from '@/config/links';
import { LANGS } from '@/i18n';
import { maskPhone } from '@/lib/phone';
import { useAppSettings } from '@/state/app-settings';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

export default function ProfileScreen() {
  const { colors } = useTheme();
  const me = useMe();
  const { signOut } = useAuth();
  const { t, lang, setLang } = useAppSettings();
  const orgs = useMyOrganizations();
  const communities = useMyCommunities();
  const open = (url: string) => WebBrowser.openBrowserAsync(url);
  const group = [styles.group, { backgroundColor: colors.surface, borderColor: colors.line }];

  const orgStatus = { pending: `⏳ ${t.org.pending}`, verified: `✓ ${t.common.verified}`, rejected: t.org.rejected };

  return (
    <Screen tabBarInset>
      {/* Карточка пользователя — тёмная секция в стиле блока «Для организаторов» на сайте */}
      <View style={[styles.hero, { backgroundColor: colors.inverse }]}>
        <View style={styles.heroTop}>
          <Avatar name={me.name} size={56} />
          <View style={{ flex: 1 }}>
            <Text variant="h2" color="onInverse">
              {me.name}
            </Text>
            <Text variant="caption" color="onInverse" style={{ opacity: 0.6 }}>
              {maskPhone(me.phone)} · {getCity(me.cityId).name[lang]}
            </Text>
          </View>
        </View>
        <View style={styles.tags}>
          {me.interests.map((id) => {
            const i = interestById.get(id);
            return i ? (
              <View key={id} style={[styles.tag, { borderColor: 'rgba(255,255,255,0.2)' }]}>
                <Text variant="caption" color="onInverse">
                  {i.emoji} {i.name[lang]}
                </Text>
              </View>
            ) : null;
          })}
        </View>
      </View>

      <Text variant="h3" style={styles.groupTitle}>
        {t.profile.myOrgs}
      </Text>
      <View style={group}>
        {(orgs.data ?? []).map((o) => (
          <SettingsRow
            key={o.id}
            label={o.name}
            value={orgStatus[o.status]}
            onPress={() => router.push({ pathname: '/org/[id]', params: { id: o.id } })}
          />
        ))}
        <SettingsRow label={`＋ ${t.profile.addOrg}`} onPress={() => router.push('/org/new')} last />
      </View>

      <Text variant="h3" style={styles.groupTitle}>
        {t.profile.myCommunities}
      </Text>
      <View style={group}>
        {(communities.data ?? []).map((c) => (
          <SettingsRow
            key={c.id}
            label={c.name}
            value={c.myRole === 'owner' ? '★' : undefined}
            onPress={() => router.push({ pathname: '/community/[id]', params: { id: c.id } })}
          />
        ))}
        <SettingsRow label={`＋ ${t.communities.create}`} onPress={() => router.push('/community/new')} last />
      </View>

      <View style={[group, { marginTop: spacing.lg }]}>
        <SettingsRow label={t.profile.city} right={<CityPicker />} />
        <SettingsRow label={t.profile.language} last right={<Segmented options={LANGS} value={lang} onChange={setLang} />} />
      </View>

      <View style={group}>
        <SettingsRow label={t.profile.offer} onPress={() => open(LEGAL_LINKS.offer)} />
        <SettingsRow label={t.profile.terms} onPress={() => open(LEGAL_LINKS.terms)} />
        <SettingsRow label={t.profile.privacy} onPress={() => open(LEGAL_LINKS.privacy)} last />
      </View>

      <Button title={t.profile.signOut} variant="ghost" onPress={signOut} />
      <Text variant="caption" color="textFaint" style={styles.version}>
        {t.profile.version} {Constants.expoConfig?.version ?? '—'}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: radius.lg, padding: spacing.xl, gap: spacing.lg, marginTop: spacing.lg, marginBottom: spacing.xl },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tag: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 4 },
  groupTitle: { marginBottom: spacing.md },
  group: { borderRadius: radius.lg, borderWidth: 1, marginBottom: spacing.lg, overflow: 'hidden' },
  version: { textAlign: 'center', marginTop: spacing.md },
});
