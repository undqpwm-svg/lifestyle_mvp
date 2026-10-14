import { router, Stack } from 'expo-router';
import { House } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { EmptyView } from '@/components/ui/state-view';
import { useAppSettings } from '@/state/app-settings';

export default function NotFoundScreen() {
  const { t } = useAppSettings();
  return (
    <Screen edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <EmptyView
        title={t.common.notFoundTitle}
        hint={t.common.notFoundHint}
        action={<Button title={t.common.home} icon={House} onPress={() => router.navigate('/(tabs)')} />}
      />
    </Screen>
  );
}
