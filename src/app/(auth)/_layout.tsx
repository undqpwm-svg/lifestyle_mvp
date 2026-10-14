import { Stack } from 'expo-router';
import { Platform } from 'react-native';

import { HeaderBack } from '@/components/header-back';

import { fonts } from '@/theme/tokens';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerTitle: '',
        headerBackButtonDisplayMode: 'minimal',
        headerTitleStyle: { fontFamily: fonts.displayBold },
        ...(Platform.OS === 'web' && { headerLeft: ({ canGoBack }) => <HeaderBack canGoBack={!!canGoBack} /> }),
      }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
