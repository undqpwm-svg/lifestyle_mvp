import { Montserrat_700Bold } from '@expo-google-fonts/montserrat/700Bold';
import { Montserrat_800ExtraBold } from '@expo-google-fonts/montserrat/800ExtraBold';
import { OpenSans_400Regular } from '@expo-google-fonts/open-sans/400Regular';
import { OpenSans_600SemiBold } from '@expo-google-fonts/open-sans/600SemiBold';
import { OpenSans_700Bold } from '@expo-google-fonts/open-sans/700Bold';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { ApiError } from '@/api/client';
import { AuthProvider, useAuth } from '@/auth/auth-context';
import { HeaderBack } from '@/components/header-back';
import { installWebFrame } from '@/lib/web-frame';
import { AppSettingsProvider, useAppSettings } from '@/state/app-settings';
import { fonts } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

SplashScreen.preventAutoHideAsync();
installWebFrame();

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // Ошибки прав/валидации повторять бессмысленно, сеть — до двух раз.
        retry: (count, e) => count < 2 && e instanceof ApiError && (e.code === 'network' || e.code === 'server'),
      },
    },
  });
}

export default function RootLayout() {
  const [queryClient] = useState(createQueryClient);
  const [fontsLoaded, fontError] = useFonts({
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
    OpenSans_400Regular,
    OpenSans_600SemiBold,
    OpenSans_700Bold,
  });

  // При ошибке загрузки шрифтов не блокируем запуск — упадём на системные.
  if (!fontsLoaded && !fontError) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <AppSettingsProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </AppSettingsProvider>
    </QueryClientProvider>
  );
}

function RootNavigator() {
  const { colors, scheme } = useTheme();
  const settings = useAppSettings();
  const auth = useAuth();
  const ready = settings.ready && auth.ready;
  const t = settings.t;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.text,
      background: colors.background,
      card: colors.background,
      text: colors.text,
      border: colors.line,
    },
  };

  const signedIn = !!auth.user;

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerTitleStyle: { fontFamily: fonts.displayBold },
          headerBackButtonDisplayMode: 'minimal',
          // В браузере после обновления страницы истории нет — даём кнопку «домой»
          ...(Platform.OS === 'web' && { headerLeft: ({ canGoBack }) => <HeaderBack canGoBack={!!canGoBack} /> }),
        }}>
        {/* Гость: только вход. Смена guard автоматически уводит на доступную группу. */}
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack.Protected>

        <Stack.Protected guard={signedIn && auth.needsOnboarding}>
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        </Stack.Protected>

        <Stack.Protected guard={signedIn && !auth.needsOnboarding}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="create" options={{ presentation: 'modal', title: t.create.title }} />
          <Stack.Screen name="event/[id]/index" options={{ title: t.event.title }} />
          <Stack.Screen name="event/[id]/checkin" options={{ title: t.checkin.title }} />
          <Stack.Screen name="ticket/[bookingId]" options={{ title: t.ticket.title, presentation: 'modal' }} />
          <Stack.Screen name="review/[bookingId]" options={{ title: t.review.title, presentation: 'modal' }} />
          <Stack.Screen name="notifications" options={{ title: t.notifications.title }} />
          <Stack.Screen name="map" options={{ title: t.map.title }} />
          <Stack.Screen name="user/[id]" options={{ title: '' }} />
          <Stack.Screen name="friends" options={{ title: t.people.friends }} />
          <Stack.Screen name="invite" options={{ title: t.invite.title }} />
          <Stack.Screen name="blocked" options={{ title: t.people.blockedTitle }} />
          <Stack.Screen name="messages/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="messages/new" options={{ title: t.messages.newMessage, presentation: 'modal' }} />
          <Stack.Screen name="event/new" options={{ title: t.eventForm.title }} />
          <Stack.Screen name="community/[id]/index" options={{ title: t.community.title }} />
          <Stack.Screen name="community/[id]/chat" options={{ headerShown: false }} />
          <Stack.Screen name="community/new" options={{ title: t.communityForm.title }} />
          <Stack.Screen name="org/[id]/index" options={{ title: t.org.title }} />
          <Stack.Screen name="org/[id]/dashboard" options={{ title: t.dashboard.title }} />
          <Stack.Screen name="org/new" options={{ title: t.orgForm.title }} />
          <Stack.Screen name="subscription" options={{ title: t.pass.name }} />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}
