import { setI18nLocale, t } from '.';
import { useAppPreferences } from '../context/AppPreferencesContext';

export function useI18n() {
  const { settings } = useAppPreferences();
  setI18nLocale(settings.language);

  return {
    t,
    locale: settings.language === 'th' ? 'th-TH' : settings.language === 'my' ? 'my-MM' : 'en-US',
  };
}
