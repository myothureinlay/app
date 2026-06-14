import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useI18n } from '../i18n/useI18n';
import { themeOptions, themes, type AppTheme } from '../theme/colors';
import type { ThemePreference, ThemePreset } from '../types';

const baseThemeOptions: ThemePreset[] = ['light', 'dark'];
const lightThemeOptions: ThemePreset[] = [
  'emeraldLight',
  'oceanLight',
  'sunsetLight',
  'royalPurpleLight',
  'sakuraLight',
  'coffeeLight',
  'goldLight',
  'myanmarJadeLight',
  'lavenderLight',
  'coralLight',
  'minimalGrayLight',
];
const darkThemeOptions: ThemePreset[] = [
  'emeraldDark',
  'ocean',
  'sunsetDark',
  'royalPurpleDark',
  'sakuraDark',
  'coffee',
  'goldBlack',
  'myanmarJadeDark',
  'lavenderDark',
  'neonCyan',
  'slateDark',
];
const premiumThemeOptions: ThemePreset[] = ['auroraGlass'];

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
  badgeLabel,
  wide,
  onPress,
}: {
  option: ThemePreference;
  label: string;
  selected: boolean;
  appTheme: AppTheme;
  badgeLabel?: string;
  wide?: boolean;
  onPress: () => void;
}) {
  const { theme } = useAppPreferences();
  const colors = appTheme.colors;
  const dots = [colors.primary, colors.secondary, colors.accent, colors.success];

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={{ width: wide ? '100%' : '48%', flexGrow: wide ? 0 : 1 }}>
      <Card
        style={{
          gap: 10,
          minHeight: 82,
          padding: 12,
          borderColor: selected ? colors.primary : theme.colors.border,
          backgroundColor: selected ? `${colors.primary}14` : theme.colors.surface,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '900' }} numberOfLines={2}>
              {label}
            </Text>
            {badgeLabel ? (
              <Text style={{ color: theme.colors.textMuted, fontSize: 11, fontWeight: '800', marginTop: 3 }}>
                {badgeLabel}
              </Text>
            ) : null}
          </View>
          {selected ? <Ionicons name="checkmark-circle-outline" size={20} color={colors.primary} /> : null}
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {dots.map((color, index) => (
            <View
              key={`${color}-${index}`}
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

function ThemeSection({
  title,
  options,
}: {
  title: string;
  options: ThemePreset[];
}) {
  const { settings, setThemePreference, theme } = useAppPreferences();
  const { t } = useI18n();

  return (
    <>
      <View style={{ width: '100%', paddingTop: 4 }}>
        <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '900' }}>{title}</Text>
      </View>
      {options.map((option) => (
        <ThemeCard
          key={option}
          option={option}
          label={labelFor(option, t)}
          selected={settings.theme === option}
          appTheme={previewTheme(option)}
          badgeLabel={option === 'auroraGlass' ? t('themePicker.premiumBadge') : undefined}
          onPress={() => setThemePreference(option)}
        />
      ))}
    </>
  );
}

export function ThemePickerScreen() {
  const { settings, setThemePreference } = useAppPreferences();
  const { t } = useI18n();

  return (
    <Screen>
      <ScreenHeader title={t('settings.themePicker')} subtitle={t('themePicker.subtitle')} />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        <ThemeCard
          option="system"
          label={t('settings.system')}
          selected={settings.theme === 'system'}
          appTheme={previewTheme('system')}
          badgeLabel={t('themePicker.autoMode')}
          wide
          onPress={() => setThemePreference('system')}
        />
        {baseThemeOptions.map((option) => (
          <ThemeCard
            key={option}
            option={option}
            label={labelFor(option, t)}
            selected={settings.theme === option}
            appTheme={previewTheme(option)}
            onPress={() => setThemePreference(option)}
          />
        ))}
        <ThemeSection title={t('themePicker.lightColorThemes')} options={lightThemeOptions} />
        <ThemeSection title={t('themePicker.darkColorThemes')} options={darkThemeOptions} />
        <ThemeSection title={t('themePicker.premiumThemes')} options={premiumThemeOptions} />
      </View>
    </Screen>
  );
}
