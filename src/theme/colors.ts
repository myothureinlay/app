import type { ThemePreset } from '../types';

export type ColorSchemeName = 'light' | 'dark';

export interface AppTheme {
  scheme: ColorSchemeName;
  colors: {
    background: string;
    surface: string;
    surfaceElevated: string;
    text: string;
    textMuted: string;
    border: string;
    primary: string;
    primaryDark: string;
    secondary: string;
    accent: string;
    success: string;
    danger: string;
    warning: string;
    tabInactive: string;
    shadow: string;
  };
  spacing: (value: number) => number;
  radius: {
    sm: number;
    md: number;
  };
}

function makeTheme(
  scheme: ColorSchemeName,
  colors: AppTheme['colors']
): AppTheme {
  return {
    scheme,
    colors,
    spacing: (value: number) => value * 8,
    radius: {
      sm: 6,
      md: 8,
    },
  };
}

export const themes: Record<ThemePreset, AppTheme> = {
  light: {
    ...makeTheme('light', {
    background: '#F7F8FC',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    text: '#171821',
    textMuted: '#6D7182',
    border: '#E7EAF1',
    primary: '#16A7A0',
    primaryDark: '#087B78',
    secondary: '#5E6AD2',
    accent: '#FF8A4C',
    success: '#16A34A',
    danger: '#E5484D',
    warning: '#F5A524',
    tabInactive: '#9197A8',
    shadow: '#16213E',
  }),
  },
  dark: {
    ...makeTheme('dark', {
    background: '#101217',
    surface: '#191C23',
    surfaceElevated: '#20242D',
    text: '#F7F8FC',
    textMuted: '#A6ADBD',
    border: '#2D333F',
    primary: '#2DD4BF',
    primaryDark: '#14B8A6',
    secondary: '#8B9CFF',
    accent: '#FFB86B',
    success: '#4ADE80',
    danger: '#FB7185',
    warning: '#FACC15',
    tabInactive: '#737B8C',
    shadow: '#000000',
  }),
  },
  ocean: makeTheme('dark', {
    background: '#071923',
    surface: '#0D2633',
    surfaceElevated: '#123445',
    text: '#E8F7FB',
    textMuted: '#9CC6D3',
    border: '#1B4659',
    primary: '#18B7CF',
    primaryDark: '#0E7C92',
    secondary: '#38BDF8',
    accent: '#2DD4BF',
    success: '#34D399',
    danger: '#FB7185',
    warning: '#FBBF24',
    tabInactive: '#75A3B1',
    shadow: '#000000',
  }),
  emerald: makeTheme('light', {
    background: '#F1FBF6',
    surface: '#FFFFFF',
    surfaceElevated: '#E8F8EF',
    text: '#123226',
    textMuted: '#5D766B',
    border: '#CFEBDD',
    primary: '#0F9F6E',
    primaryDark: '#08754F',
    secondary: '#10B981',
    accent: '#F59E0B',
    success: '#16A34A',
    danger: '#DC2626',
    warning: '#D97706',
    tabInactive: '#7A9388',
    shadow: '#073B2A',
  }),
  royalPurple: makeTheme('dark', {
    background: '#151020',
    surface: '#211832',
    surfaceElevated: '#2C2142',
    text: '#FBF7FF',
    textMuted: '#C6B8DA',
    border: '#3D3154',
    primary: '#A78BFA',
    primaryDark: '#7C3AED',
    secondary: '#F0ABFC',
    accent: '#FBBF24',
    success: '#4ADE80',
    danger: '#FB7185',
    warning: '#FACC15',
    tabInactive: '#9587AA',
    shadow: '#000000',
  }),
  sunset: makeTheme('light', {
    background: '#FFF7F1',
    surface: '#FFFFFF',
    surfaceElevated: '#FFE8D8',
    text: '#352016',
    textMuted: '#7C5F52',
    border: '#F4D2C0',
    primary: '#F97316',
    primaryDark: '#C2410C',
    secondary: '#EF4444',
    accent: '#F59E0B',
    success: '#16A34A',
    danger: '#DC2626',
    warning: '#D97706',
    tabInactive: '#A1887A',
    shadow: '#4C1D0D',
  }),
  goldBlack: makeTheme('dark', {
    background: '#0F0E0A',
    surface: '#1B1810',
    surfaceElevated: '#272216',
    text: '#FFF8E1',
    textMuted: '#C9B98A',
    border: '#3D3520',
    primary: '#FACC15',
    primaryDark: '#CA8A04',
    secondary: '#F59E0B',
    accent: '#FFFFFF',
    success: '#84CC16',
    danger: '#F87171',
    warning: '#FBBF24',
    tabInactive: '#9B8C5B',
    shadow: '#000000',
  }),
  minimalGray: makeTheme('light', {
    background: '#F5F5F5',
    surface: '#FFFFFF',
    surfaceElevated: '#EEEEEE',
    text: '#1F2933',
    textMuted: '#667085',
    border: '#D9DEE7',
    primary: '#4B5563',
    primaryDark: '#111827',
    secondary: '#6B7280',
    accent: '#0EA5E9',
    success: '#15803D',
    danger: '#B91C1C',
    warning: '#B45309',
    tabInactive: '#8A94A6',
    shadow: '#111827',
  }),
  myanmarJade: makeTheme('light', {
    background: '#F2FBF8',
    surface: '#FFFFFF',
    surfaceElevated: '#DDF6EC',
    text: '#12372E',
    textMuted: '#5C7D73',
    border: '#BEE8D8',
    primary: '#008C6E',
    primaryDark: '#00624D',
    secondary: '#15A08A',
    accent: '#D4AF37',
    success: '#16A34A',
    danger: '#DC2626',
    warning: '#C99700',
    tabInactive: '#71958B',
    shadow: '#063D32',
  }),
};

export const themeOptions: Array<{ value: ThemePreset | 'system'; labelKey: string; accent: string }> = [
  { value: 'system', labelKey: 'settings.system', accent: '#64748B' },
  { value: 'light', labelKey: 'settings.light', accent: themes.light.colors.primary },
  { value: 'dark', labelKey: 'settings.dark', accent: themes.dark.colors.primary },
  { value: 'ocean', labelKey: 'settings.ocean', accent: themes.ocean.colors.primary },
  { value: 'emerald', labelKey: 'settings.emerald', accent: themes.emerald.colors.primary },
  { value: 'royalPurple', labelKey: 'settings.royalPurple', accent: themes.royalPurple.colors.primary },
  { value: 'sunset', labelKey: 'settings.sunset', accent: themes.sunset.colors.primary },
  { value: 'goldBlack', labelKey: 'settings.goldBlack', accent: themes.goldBlack.colors.primary },
  { value: 'minimalGray', labelKey: 'settings.minimalGray', accent: themes.minimalGray.colors.primary },
  { value: 'myanmarJade', labelKey: 'settings.myanmarJade', accent: themes.myanmarJade.colors.primary },
];
