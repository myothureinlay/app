import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useI18n } from '../i18n/useI18n';
import { themeOptions } from '../theme/colors';
import type { ThemePreference } from '../types';

export function ThemePickerScreen() {
  const { theme, settings, setThemePreference } = useAppPreferences();
  const { t } = useI18n();

  return (
    <Screen>
      <ScreenHeader title={t('settings.themePicker')} subtitle={t('settings.appearance')} />
      <View style={{ gap: 12 }}>
        {themeOptions.map((option) => {
          const selected = settings.theme === option.value;
          return (
            <Pressable key={option.value} onPress={() => setThemePreference(option.value as ThemePreference)}>
              <Card
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  borderColor: selected ? option.accent : theme.colors.border,
                }}
              >
                <View
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: theme.radius.md,
                    backgroundColor: option.accent,
                  }}
                />
                <Text style={{ flex: 1, color: theme.colors.text, fontSize: 16, fontWeight: '900' }}>{t(option.labelKey)}</Text>
                {selected ? <Ionicons name="checkmark-circle-outline" size={22} color={option.accent} /> : null}
              </Card>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
