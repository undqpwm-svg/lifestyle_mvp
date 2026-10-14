import Constants from 'expo-constants';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Ban, BadgeCheck, RotateCcw, ChartColumn, Crown, Gift, Hourglass, LogOut, Plus, Star, Users, XCircle } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { interestById } from '@/api/interests';
import { isMockApi, resetMockDb } from '@/api/client';
import { useMyCommunities, useMyOrganizations, useMySubscription, useProfile } from '@/api/queries';
import { useAuth, useMe } from '@/auth/auth-context';
import { AvatarPicker } from '@/components/avatar-picker';
import { CityPicker } from '@/components/city-picker';
import { INTEREST_ICONS } from '@/components/icons';
import { SettingsRow } from '@/components/settings-row';
import { Button } from '@/components/ui/button';
import { Sheet, SheetOption } from '@/components/ui/sheet';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { Segmented } from '@/components/ui/segmented';
import { Text } from '@/components/ui/text';
import { getCity } from '@/config/cities';
import { LEGAL_LINKS } from '@/config/links';
import { LANGS } from '@/i18n';
import { fill, formatDate, formatKzt } from '@/lib/format';
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
  const sub = useMySubscription();
  const passLive = sub.data && sub.data.status !== 'expired';
  const profile = useProfile();
  const [resetOpen, setResetOpen] = useState(false);
  const open = (url: string) => WebBrowser.openBrowserAsync(url);
  const group = [styles.group, { backgroundColor: colors.surface, borderColor: colors.line }];

  const orgStatus = {
    pending: { label: t.org.pending, icon: Hourglass },
    verified: { label: t.common.verified, icon: BadgeCheck },
    rejected: { label: t.org.rejected, icon: XCircle },
  };

  return (
    <Screen tabBarInset>
      {/* Карточка пользователя — тёмная секция в стиле блока «Для организаторов» на сайте */}
      <View style={[styles.hero, { backgroundColor: colors.inverse }]}>
        <View style={styles.heroTop}>
          <AvatarPicker name={me.name} uri={profile.data?.avatarUrl} size={64} />
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
                <Icon icon={INTEREST_ICONS[id]} size={14} color="onInverse" />
                <Text variant="caption" color="onInverse">
                  {i.name[lang]}
                </Text>
              </View>
            ) : null;
          })}
        </View>
      </View>

      <View style={group}>
        <SettingsRow
          icon={Crown}
          label={t.pass.name}
          value={passLive ? fill(t.pass.until, { date: formatDate(sub.data!.endsAt, lang) }) : undefined}
          onPress={() => router.push('/subscription')}
        />
        <SettingsRow icon={Users} label={t.profile.friends} onPress={() => router.push('/friends')} />
        <SettingsRow
          icon={Gift}
          label={t.profile.invite}
          value={profile.data?.bonusKzt ? formatKzt(profile.data.bonusKzt) : undefined}
          onPress={() => router.push('/invite')}
          last
        />
      </View>

      <Text variant="h3" style={styles.groupTitle}>
        {t.profile.myOrgs}
      </Text>
      <View style={group}>
        {(orgs.data ?? []).map((o) => (
          <SettingsRow
            key={o.id}
            label={o.name}
            value={orgStatus[o.status].label}
            valueIcon={orgStatus[o.status].icon}
            onPress={() => router.push({ pathname: '/org/[id]', params: { id: o.id } })}
          />
        ))}
        {(orgs.data ?? []).map((o) => (
          <SettingsRow
            key={`dash-${o.id}`}
            icon={ChartColumn}
            label={`${t.profile.dashboard} · ${o.name}`}
            onPress={() => router.push({ pathname: '/org/[id]/dashboard', params: { id: o.id } })}
          />
        ))}
        <SettingsRow icon={Plus} label={t.profile.addOrg} onPress={() => router.push('/org/new')} last />
      </View>

      <Text variant="h3" style={styles.groupTitle}>
        {t.profile.myCommunities}
      </Text>
      <View style={group}>
        {(communities.data ?? []).map((c) => (
          <SettingsRow
            key={c.id}
            label={c.name}
            valueIcon={c.myRole === 'owner' ? Star : undefined}
            onPress={() => router.push({ pathname: '/community/[id]', params: { id: c.id } })}
          />
        ))}
        <SettingsRow icon={Plus} label={t.communities.create} onPress={() => router.push('/community/new')} last />
      </View>

      <View style={[group, { marginTop: spacing.lg }]}>
        <SettingsRow label={t.profile.city} right={<CityPicker />} />
        <SettingsRow label={t.profile.language} last right={<Segmented options={LANGS} value={lang} onChange={setLang} />} />
      </View>

      <View style={group}>
        <SettingsRow icon={Ban} label={t.people.blockedTitle} onPress={() => router.push('/blocked')} />
        <SettingsRow label={t.profile.offer} onPress={() => open(LEGAL_LINKS.offer)} />
        <SettingsRow label={t.profile.terms} onPress={() => open(LEGAL_LINKS.terms)} />
        <SettingsRow label={t.profile.privacy} onPress={() => open(LEGAL_LINKS.privacy)} last />
      </View>

      <Button title={t.profile.signOut} icon={LogOut} variant="ghost" onPress={signOut} />
      {isMockApi ? (
        <Button title={t.common.demoReset} icon={RotateCcw} variant="ghost" style={{ marginTop: spacing.md }} onPress={() => setResetOpen(true)} />
      ) : null}
      <Sheet visible={resetOpen} onClose={() => setResetOpen(false)} title={t.common.demoReset}>
        <Text color="textMuted" style={{ marginBottom: spacing.sm }}>
          {t.common.demoResetHint}
        </Text>
        <SheetOption
          icon={RotateCcw}
          label={t.common.demoReset}
          onPress={async () => {
            setResetOpen(false);
            await resetMockDb();
            await signOut();
          }}
        />
      </Sheet>
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
  tag: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 4 },
  groupTitle: { marginBottom: spacing.md },
  group: { borderRadius: radius.lg, borderWidth: 1, marginBottom: spacing.lg, overflow: 'hidden' },
  version: { textAlign: 'center', marginTop: spacing.md },
});
