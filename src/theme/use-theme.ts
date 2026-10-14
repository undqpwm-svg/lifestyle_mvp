import { useColorScheme } from 'react-native';

import { colors, type ThemeColors } from './tokens';

export function useTheme(): { colors: ThemeColors; scheme: 'light' | 'dark' } {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return { colors: colors[scheme], scheme };
}
