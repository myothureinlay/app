import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

import { setI18nLocale } from '../i18n';
import { themes, type AppTheme, type ColorSchemeName } from '../theme/colors';
import type { AppSettings, BaseCurrency, LanguageCode, ThemePreference } from '../types';

const storageKey = '@personal-finance/settings';

const supportedLanguages: LanguageCode[] = ['en', 'my', 'th'];

const deviceLanguage = (() => {
  const code = Localization.getLocales()[0]?.languageCode as LanguageCode | undefined;
  return code && supportedLanguages.includes(code) ? code : 'en';
})();

const defaultSettings: AppSettings = {
  theme: 'system',
  language: deviceLanguage,
  baseCurrency: 'USD',
  dashboardCurrencyFilter: 'all',
};

interface PreferencesContextValue {
  settings: AppSettings;
  theme: AppTheme;
  resolvedScheme: ColorSchemeName;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  setThemePreference: (theme: ThemePreference) => Promise<void>;
  setLanguage: (language: LanguageCode) => Promise<void>;
  setBaseCurrency: (currency: BaseCurrency) => Promise<void>;
}

const AppPreferencesContext = createContext<PreferencesContextValue | null>(null);

export function AppPreferencesProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  useEffect(() => {
    async function load() {
      const raw = await AsyncStorage.getItem(storageKey);
      if (!raw) {
        setI18nLocale(defaultSettings.language);
        return;
      }

      const next = { ...defaultSettings, ...JSON.parse(raw) } as AppSettings;
      setSettings(next);
      setI18nLocale(next.language);
    }

    load().catch(() => setI18nLocale(defaultSettings.language));
  }, []);

  const resolvedScheme: ColorSchemeName =
    settings.theme === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : settings.theme;

  const updateSettings = async (patch: Partial<AppSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    setI18nLocale(next.language);
    await AsyncStorage.setItem(storageKey, JSON.stringify(next));
  };

  const value = useMemo<PreferencesContextValue>(
    () => ({
      settings,
      theme: themes[resolvedScheme],
      resolvedScheme,
      updateSettings,
      setThemePreference: (theme) => updateSettings({ theme }),
      setLanguage: (language) => updateSettings({ language }),
      setBaseCurrency: (baseCurrency) => updateSettings({ baseCurrency }),
    }),
    [settings, resolvedScheme]
  );

  return <AppPreferencesContext.Provider value={value}>{children}</AppPreferencesContext.Provider>;
}

export function useAppPreferences() {
  const value = useContext(AppPreferencesContext);
  if (!value) {
    throw new Error('useAppPreferences must be used within AppPreferencesProvider');
  }
  return value;
}
