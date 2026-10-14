import { router } from 'expo-router';
import { ArrowLeft, House } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { useAppSettings } from '@/state/app-settings';

import { Icon } from './ui/icon';

/**
 * Кнопка «назад» для веб-версии. После обновления страницы на вложенном экране истории навигации нет,
 * и стандартная стрелка пропадает — тогда показываем «домой», чтобы человек не застрял.
 */
export function HeaderBack({ canGoBack }: { canGoBack: boolean }) {
  const { t } = useAppSettings();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={canGoBack ? t.common.back : t.common.home}
      hitSlop={10}
      // '/(tabs)', а не '/': без истории навигации Expo Router на вебе игнорирует переход на '/'
      onPress={() => (canGoBack ? router.back() : router.navigate('/(tabs)'))}
      style={{ paddingRight: 12, paddingVertical: 6 }}>
      <Icon icon={canGoBack ? ArrowLeft : House} size={22} />
    </Pressable>
  );
}
