import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { SectionHeader } from '../components/SectionHeader';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useI18n } from '../i18n/useI18n';
import { buildCustomTheme, themeOptions, themes, type AppTheme } from '../theme/colors';
import type { ThemePreference } from '../types';

function previewTheme(option: ThemePreference, customTheme: ReturnType<typeof buildCustomTheme>): AppTheme {
  if (option === 'custom') return customTheme;
  if (option === 'system') return themes.light;
  return themes[option];
}

function labelFor(option: ThemePreference, t: (key: string) => string) {
  if (option === 'custom') return t('themeBuilder.title');
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
  const dots = [colors.primary, colors.secondary, colors.accent, colors.surfaceElevated];

  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <Card
        style={{
          gap: 12,
          borderColor: selected ? colors.primary : theme.colors.border,
          backgroundColor: selected ? `${colors.primary}12` : theme.colors.surface,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '900' }}>{label}</Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 3 }}>
              {modeLabel}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 5 }}>
            {dots.map((color) => (
              <View key={color} style={{ width: 15, height: 15, borderRadius: 8, backgroundColor: color }} />
            ))}
          </View>
          {selected ? <Ionicons name="checkmark-circle-outline" size={24} color={colors.primary} /> : null}
        </View>

        <View
          style={{
            height: 74,
            borderRadius: theme.radius.md,
            backgroundColor: colors.background,
            borderColor: colors.border,
            borderWidth: 1,
            padding: 10,
            gap: 8,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: colors.primary }} />
            <View style={{ flex: 1, gap: 5 }}>
              <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.text }} />
              <View style={{ width: '62%', height: 7, borderRadius: 4, backgroundColor: colors.textMuted }} />
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <View style={{ flex: 1, height: 10, borderRadius: 5, backgroundColor: colors.success }} />
            <View style={{ flex: 1, height: 10, borderRadius: 5, backgroundColor: colors.danger }} />
            <View style={{ flex: 1, height: 10, borderRadius: 5, backgroundColor: colors.warning }} />
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

export function ThemePickerScreen() {
  const { settings, setThemePreference } = useAppPreferences();
  const { t } = useI18n();
  const customTheme = buildCustomTheme(settings.customTheme);
  const recent = (settings.recentThemes ?? []).filter((item, index, list) => list.indexOf(item) === index).slice(0, 4);

  return (
    <Screen>
      <ScreenHeader title={t('settings.themePicker')} subtitle={t('themeBuilder.managerSubtitle')} />

      {recent.length > 0 ? (
        <>
          <SectionHeader title={t('themeBuilder.recentThemes')} />
          <View style={{ gap: 12 }}>
            {recent.map((option) => (
              <ThemeCard
                key={`recent-${option}`}
                option={option}
                label={labelFor(option, t)}
                selected={settings.theme === option}
                appTheme={previewTheme(option, customTheme)}
                modeLabel={option === 'system' ? t('themeBuilder.autoMode') : previewTheme(option, customTheme).scheme === 'dark' ? t('settings.dark') : t('settings.light')}
                onPress={() => setThemePreference(option)}
              />
            ))}
          </View>
        </>
      ) : null}

      <SectionHeader title={t('themeBuilder.builtInThemes')} />
      <View style={{ gap: 12 }}>
        {themeOptions.map((option) => (
          <ThemeCard
            key={option.value}
            option={option.value}
            label={t(option.labelKey)}
            selected={settings.theme === option.value}
            appTheme={previewTheme(option.value, customTheme)}
            modeLabel={option.value === 'system' ? t('themeBuilder.autoMode') : previewTheme(option.value, customTheme).scheme === 'dark' ? t('settings.dark') : t('settings.light')}
            onPress={() => setThemePreference(option.value as ThemePreference)}
          />
        ))}
      </View>

      <SectionHeader title={t('themeBuilder.myCustomTheme')} />
      <ThemeCard
        option="custom"
        label={t('themeBuilder.title')}
        selected={settings.theme === 'custom'}
        appTheme={customTheme}
        modeLabel={customTheme.scheme === 'dark' ? t('settings.dark') : t('settings.light')}
        onPress={() => setThemePreference('custom')}
      />
    </Screen>
  );
}
