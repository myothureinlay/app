import { Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { ChipGroup } from '../components/ChipGroup';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { TextField } from '../components/TextField';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useI18n } from '../i18n/useI18n';
import { defaultCustomTheme } from '../theme/colors';
import type { CustomThemeSettings } from '../types';

const colorFields: Array<keyof Pick<CustomThemeSettings, 'primary' | 'secondary' | 'accent' | 'background' | 'surface' | 'text' | 'success' | 'warning' | 'danger' | 'border'>> = [
  'primary',
  'secondary',
  'accent',
  'background',
  'surface',
  'text',
  'success',
  'warning',
  'danger',
  'border',
];

export function CustomThemeBuilderScreen() {
  const { theme, settings, updateSettings, setThemePreference } = useAppPreferences();
  const { t } = useI18n();
  const customTheme = settings.customTheme ?? defaultCustomTheme;

  const updateCustom = (patch: Partial<CustomThemeSettings>) => updateSettings({ customTheme: { ...customTheme, ...patch } });

  return (
    <Screen>
      <ScreenHeader title={t('themeBuilder.title')} subtitle={t('themeBuilder.subtitle')} />
      <Card style={{ gap: 12 }}>
        <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '900' }}>{t('themeBuilder.preview')}</Text>
        <View style={{ backgroundColor: customTheme.background, borderColor: customTheme.border, borderWidth: 1, borderRadius: customTheme.borderRadius, padding: 16, gap: 8 }}>
          <Text style={{ color: customTheme.text, fontSize: 18, fontWeight: '900' }}>{t('dashboard.netWorth')}</Text>
          <Text style={{ color: customTheme.primary, fontSize: 26, fontWeight: '900' }}>$ 12,340.00</Text>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: customTheme.secondary }} />
        </View>
      </Card>

      <Card style={{ gap: 12 }}>
        {colorFields.map((field) => (
          <TextField key={field} label={t(`themeBuilder.${field}`)} value={customTheme[field]} onChangeText={(value) => updateCustom({ [field]: value })} />
        ))}
        <TextField label={t('themeBuilder.radius')} value={String(customTheme.borderRadius)} onChangeText={(value) => updateCustom({ borderRadius: Number(value) || 8 })} keyboardType="number-pad" />
        <ChipGroup
          value={customTheme.cardStyle}
          onChange={(cardStyle) => updateCustom({ cardStyle })}
          options={[
            { label: t('themeBuilder.flat'), value: 'flat' },
            { label: t('themeBuilder.soft'), value: 'soft' },
            { label: t('themeBuilder.elevated'), value: 'elevated' },
          ]}
        />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <AppButton title={t('themeBuilder.apply')} icon="color-palette-outline" onPress={() => setThemePreference('custom')} style={{ flex: 1 }} />
          <AppButton title={t('themeBuilder.reset')} variant="secondary" onPress={() => updateCustom(defaultCustomTheme)} style={{ flex: 1 }} />
        </View>
      </Card>
    </Screen>
  );
}
