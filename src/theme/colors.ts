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

export const themes: Record<ColorSchemeName, AppTheme> = {
  light: {
    scheme: 'light',
    colors: {
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
    },
    spacing: (value: number) => value * 8,
    radius: {
      sm: 6,
      md: 8,
    },
  },
  dark: {
    scheme: 'dark',
    colors: {
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
    },
    spacing: (value: number) => value * 8,
    radius: {
      sm: 6,
      md: 8,
    },
  },
};
