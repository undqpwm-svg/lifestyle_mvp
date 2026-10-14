// Дизайн-токены LIFESTYLE. Палитра снята с lifestyle.ink (CSS-переменные --bg/--ink/--yellow).
// Менять цвета только здесь — компоненты берут значения через useTheme().

export const palette = {
  cream: '#FFFEF8',
  ink: '#111111',
  yellow: '#FFD400',
  yellowSoft: '#FFF1A8',
  sand: '#F4F1E6',
  sandDark: '#ECE4CF',
  white: '#FFFFFF',
  graphite: '#1A1A1A',
  graphiteLight: '#242424',
  danger: '#E5484D',
  success: '#2F9E44',
} as const;

const light = {
  background: palette.cream,
  surface: palette.white,
  surfaceAlt: palette.sand,
  text: palette.ink,
  textMuted: 'rgba(17,17,17,0.62)',
  textFaint: 'rgba(17,17,17,0.38)',
  line: 'rgba(17,17,17,0.12)',
  accent: palette.yellow,
  accentSoft: palette.yellowSoft,
  onAccent: palette.ink,
  inverse: palette.ink,
  onInverse: palette.cream,
  danger: palette.danger,
  success: palette.success,
};

export type ThemeColors = { [K in keyof typeof light]: string };

const dark: ThemeColors = {
  background: palette.ink,
  surface: palette.graphite,
  surfaceAlt: palette.graphiteLight,
  text: palette.cream,
  textMuted: 'rgba(255,254,248,0.65)',
  textFaint: 'rgba(255,254,248,0.38)',
  line: 'rgba(255,255,255,0.10)',
  accent: palette.yellow,
  accentSoft: 'rgba(255,212,0,0.14)',
  onAccent: palette.ink,
  inverse: palette.cream,
  onInverse: palette.ink,
  danger: palette.danger,
  success: palette.success,
};

export const colors = { light, dark } as const;

// Montserrat — замена фирменного Intro (коммерческий шрифт). Outfit с сайта не подходит:
// в нём нет кириллицы. Montserrat и Open Sans покрывают казахские буквы (ә, ғ, қ, ң, ө, ұ, ү, һ, і).
export const fonts = {
  display: 'Montserrat_800ExtraBold',
  displayBold: 'Montserrat_700Bold',
  body: 'OpenSans_400Regular',
  bodySemi: 'OpenSans_600SemiBold',
  bodyBold: 'OpenSans_700Bold',
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { sm: 10, md: 16, lg: 22, pill: 999 } as const;

export const typography = {
  h1: { fontFamily: fonts.display, fontSize: 30, lineHeight: 35, letterSpacing: -0.8 },
  h2: { fontFamily: fonts.display, fontSize: 24, lineHeight: 29, letterSpacing: -0.5 },
  h3: { fontFamily: fonts.displayBold, fontSize: 17, lineHeight: 23, letterSpacing: -0.2 },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.bodySemi, fontSize: 15, lineHeight: 22 },
  caption: { fontFamily: fonts.bodySemi, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: fonts.bodyBold, fontSize: 12, lineHeight: 16, letterSpacing: 0.4 },
} as const;

export type TypographyVariant = keyof typeof typography;
