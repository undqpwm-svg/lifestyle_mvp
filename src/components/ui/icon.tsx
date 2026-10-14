import { createLucideIcon, type LucideIcon } from 'lucide-react-native';

import type { ThemeColors } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

export type { LucideIcon };

type Props = {
  icon: LucideIcon;
  size?: number;
  /** Цвет из темы; tint — произвольный цвет поверх темы (например, на фото) */
  color?: keyof ThemeColors;
  tint?: string;
  strokeWidth?: number;
};

// Все иконки приложения — линейные Lucide (stroke 2), как контурные значки на lifestyle.ink.
export function Icon({ icon: Glyph, size = 18, color = 'text', tint, strokeWidth = 2 }: Props) {
  const { colors } = useTheme();
  return <Glyph size={size} color={tint ?? colors[color]} strokeWidth={strokeWidth} />;
}

// В Lucide нет баскетбольного и теннисного мяча — дорисованы в той же сетке 24×24.
export const BasketballIcon = createLucideIcon('basketball', [
  ['circle', { cx: '12', cy: '12', r: '10', key: 'b1' }],
  ['path', { d: 'M2 12h20', key: 'b2' }],
  ['path', { d: 'M12 2v20', key: 'b3' }],
  ['path', { d: 'M5 4.9a10 10 0 0 1 0 14.2', key: 'b4' }],
  ['path', { d: 'M19 4.9a10 10 0 0 0 0 14.2', key: 'b5' }],
]);

export const TennisBallIcon = createLucideIcon('tennis-ball', [
  ['circle', { cx: '12', cy: '12', r: '10', key: 't1' }],
  ['path', { d: 'M5.2 4.7a10.5 10.5 0 0 1 0 14.6', key: 't2' }],
  ['path', { d: 'M18.8 4.7a10.5 10.5 0 0 0 0 14.6', key: 't3' }],
]);
