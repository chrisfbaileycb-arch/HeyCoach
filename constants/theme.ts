export const Colors = {
  background: '#0C0C14',
  surface: '#141420',
  card: '#1C1C2E',
  cardActive: '#242438',
  border: '#2C2C44',
  borderLight: '#3A3A56',

  primary: '#F59E0B',
  primaryDark: '#D97706',
  primaryGlow: 'rgba(245, 158, 11, 0.12)',
  emphasis: '#EA580C',

  text: '#F0EFE8',
  textSecondary: '#9CA3AF',
  textSubtle: '#6B7280',
  textInverse: '#0C0C14',

  success: '#10B981',
  successDim: 'rgba(16, 185, 129, 0.12)',
  danger: '#EF4444',
  dangerDim: 'rgba(239, 68, 68, 0.12)',

  morning: '#F97316',
  midday: '#10B981',
  evening: '#818CF8',

  white: '#FFFFFF',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  xxl: 24,
  full: 999,
};

export const Typography = {
  hero: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.5 },
  h1: { fontSize: 22, fontWeight: '700' as const },
  h2: { fontSize: 18, fontWeight: '700' as const },
  h3: { fontSize: 15, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodyBold: { fontSize: 15, fontWeight: '600' as const },
  small: { fontSize: 13, fontWeight: '400' as const },
  smallBold: { fontSize: 13, fontWeight: '600' as const },
  micro: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.5 },
};
