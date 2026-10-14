import { Text as RNText, type TextProps } from 'react-native';

import { typography, type ThemeColors, type TypographyVariant } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

export type TextVariantProps = {
  variant?: TypographyVariant;
  color?: keyof ThemeColors;
};

type Props = TextProps & TextVariantProps;

export function Text({ variant = 'body', color = 'text', style, ...rest }: Props) {
  const { colors } = useTheme();
  return <RNText style={[typography[variant], { color: colors[color] }, style]} {...rest} />;
}
