import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { languages } from '../i18n/languages';
import { useI18n } from '../i18n/useI18n';
import type { LanguageCode } from '../types';

export function LanguagePickerScreen() {
  const { theme, settings, setLanguage } = useAppPreferences();
  const { t } = useI18n();

  return (
    <Screen>
      <ScreenHeader title={t('settings.languagePicker')} subtitle={t('settings.language')} />
      <View style={{ gap: 12 }}>
        {languages.map((language) => {
          const selected = settings.language === language.code;
          return (
            <Pressable key={language.code} onPress={() => setLanguage(language.code as LanguageCode)}>
              <Card
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  borderColor: selected ? theme.colors.primary : theme.colors.border,
                }}
              >
                <View
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: theme.radius.md,
                    backgroundColor: `${theme.colors.primary}20`,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: theme.colors.primary, fontSize: 16, fontWeight: '900' }}>
                    {language.code.slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '900' }}>{language.nativeName}</Text>
                  <Text style={{ color: theme.colors.textMuted, fontSize: 13 }}>{language.label}</Text>
                </View>
                {selected ? <Ionicons name="checkmark-circle-outline" size={22} color={theme.colors.primary} /> : null}
              </Card>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
