import { setI18nLocale, t } from '.';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { localeForLanguage } from './languages';

export function useI18n() {
  const { settings } = useAppPreferences();
  setI18nLocale(settings.language);

  return {
    t,
    locale: localeForLanguage(settings.language),
  };
}
