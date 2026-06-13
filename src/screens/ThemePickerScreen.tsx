import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useI18n } from '../i18n/useI18n';
import { themeOptions, themes, type AppTheme } from '../theme/colors';
import type { ThemePreference, ThemePreset } from '../types';

function previewTheme(option: ThemePreset | 'system'): AppTheme {
  if (option === 'system') return themes.light;
  return themes[option];
}

function labelFor(option: ThemePreference, t: (key: string) => string) {
  return t(themeOptions.find((item) => item.value === option)?.labelKey ?? 'settings.theme');
}

function ThemeCard({
  option,
  label,
  selected,
  appTheme,
  modeLabel,
  onPress,
}: {
  option: ThemePreference;
  label: string;
  selected: boolean;
  appTheme: AppTheme;
  modeLabel: string;
  onPress: () => void;
}) {
  const { theme } = useAppPreferences();
  const colors = appTheme.colors;
  const dots = [colors.primary, colors.secondary, colors.accent, colors.success];

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={{ width: '48%', flexGrow: 1 }}>
      <Card
        style={{
          gap: 8,
          minHeight: 86,
          padding: 12,
          borderColor: selected ? colors.primary : theme.colors.border,
          backgroundColor: selected ? `${colors.primary}12` : theme.colors.surface,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '900' }} numberOfLines={2}>
              {label}
            </Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 3 }}>
              {modeLabel}
            </Text>
          </View>
          {selected ? <Ionicons name="checkmark-circle-outline" size={20} color={colors.primary} /> : null}
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {dots.map((color) => (
            <View
              key={color}
              style={{
                width: 14,
                height: 14,
                borderRadius: 7,
                backgroundColor: color,
                borderWidth: 1,
                borderColor: theme.colors.border,
              }}
            />
          ))}
        </View>
      </Card>
    </Pressable>
  );
}

export function ThemePickerScreen() {
  const { settings, setThemePreference } = useAppPreferences();
  const { t } = useI18n();

  return (
    <Screen>
      <ScreenHeader title={t('settings.themePicker')} subtitle={t('themePicker.subtitle')} />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {themeOptions.map((option) => (
          <ThemeCard
            key={option.value}
            option={option.value}
            label={t(option.labelKey)}
            selected={settings.theme === option.value}
            appTheme={previewTheme(option.value)}
            modeLabel={option.value === 'system' ? t('themePicker.autoMode') : previewTheme(option.value).scheme === 'dark' ? t('settings.dark') : t('settings.light')}
            onPress={() => setThemePreference(option.value as ThemePreference)}
          />
        ))}
      </View>
    </Screen>
  );
}
