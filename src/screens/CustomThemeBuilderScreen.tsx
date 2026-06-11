import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { PickerField } from '../components/PickerField';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { SectionHeader } from '../components/SectionHeader';
import { TextField } from '../components/TextField';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useI18n } from '../i18n/useI18n';
import { defaultCustomTheme } from '../theme/colors';
import type { CustomThemeSettings } from '../types';

type EditableColorField = keyof Pick<
  CustomThemeSettings,
  'primary' | 'secondary' | 'accent' | 'background' | 'surface' | 'text' | 'success' | 'warning' | 'danger' | 'border'
>;

const colorFields: EditableColorField[] = ['primary', 'secondary', 'accent', 'background', 'surface', 'text'];
const advancedFields: EditableColorField[] = ['success', 'warning', 'danger', 'border'];

const swatches = [
  '#16A7A0',
  '#0EA5E9',
  '#2563EB',
  '#7C3AED',
  '#DB2777',
  '#E11D48',
  '#F97316',
  '#F59E0B',
  '#16A34A',
  '#008C6E',
  '#111827',
  '#F8FAFC',
];

const palettes: Array<{ nameKey: string; colors: Partial<CustomThemeSettings> }> = [
  { nameKey: 'themeBuilder.paletteOcean', colors: { primary: '#0284C7', secondary: '#38BDF8', accent: '#2DD4BF', background: '#F2FAFF', surface: '#FFFFFF', text: '#102A43' } },
  { nameKey: 'themeBuilder.paletteJade', colors: { primary: '#008C6E', secondary: '#15A08A', accent: '#D4AF37', background: '#F2FBF8', surface: '#FFFFFF', text: '#12372E' } },
  { nameKey: 'themeBuilder.paletteRuby', colors: { primary: '#E11D48', secondary: '#FB7185', accent: '#FBBF24', background: '#17070A', surface: '#260D13', text: '#FFF1F2' } },
  { nameKey: 'themeBuilder.paletteMinimal', colors: { primary: '#4B5563', secondary: '#6B7280', accent: '#0EA5E9', background: '#F5F5F5', surface: '#FFFFFF', text: '#1F2933' } },
];

function normalizeHex(value: string) {
  const trimmed = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed.toUpperCase();
  return value;
}

function hexToRgb(hex: string) {
  const normalized = normalizeHex(hex);
  if (!/^#[0-9A-F]{6}$/.test(normalized)) return null;
  return {
    r: parseInt(normalized.slice(1, 3), 16),
    g: parseInt(normalized.slice(3, 5), 16),
    b: parseInt(normalized.slice(5, 7), 16),
  };
}

function luminance(hex: string) {
  const rgb = hexToRgb(hex);
  if (!rgb) return 1;
  const values = [rgb.r, rgb.g, rgb.b].map((value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2];
}

function contrastRatio(a: string, b: string) {
  const light = Math.max(luminance(a), luminance(b));
  const dark = Math.min(luminance(a), luminance(b));
  return (light + 0.05) / (dark + 0.05);
}

function readable(theme: CustomThemeSettings) {
  return contrastRatio(theme.text, theme.background) >= 4.5 && contrastRatio(theme.text, theme.surface) >= 4.5;
}

export function CustomThemeBuilderScreen() {
  const { theme, settings, updateSettings, setThemePreference } = useAppPreferences();
  const { t } = useI18n();
  const [draft, setDraft] = useState<CustomThemeSettings>(settings.customTheme ?? defaultCustomTheme);
  const [selectedField, setSelectedField] = useState<EditableColorField>('primary');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const hasReadableContrast = readable(draft);

  const updateDraft = (patch: Partial<CustomThemeSettings>) => setDraft((current) => ({ ...current, ...patch }));
  const updateColor = (field: EditableColorField, value: string) => updateDraft({ [field]: normalizeHex(value) });

  const save = async () => {
    await updateSettings({ customTheme: draft });
    await setThemePreference('custom');
  };

  return (
    <Screen>
      <ScreenHeader title={t('themeBuilder.title')} subtitle={t('themeBuilder.subtitle')} />

      <Card style={{ gap: 14 }}>
        <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '900' }}>{t('themeBuilder.livePreview')}</Text>
        <View
          style={{
            backgroundColor: draft.background,
            borderColor: draft.border,
            borderWidth: 1,
            borderRadius: draft.borderRadius,
            padding: 16,
            gap: 12,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
            <View>
              <Text style={{ color: draft.text, fontSize: 13, fontWeight: '800' }}>{t('dashboard.netWorth')}</Text>
              <Text style={{ color: draft.primary, fontSize: 26, fontWeight: '900' }}>$ 12,340.00</Text>
            </View>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: draft.accent, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="add-outline" size={24} color={draft.background} />
            </View>
          </View>
          <View style={{ backgroundColor: draft.surface, borderRadius: draft.borderRadius, padding: 12, gap: 8 }}>
            <Text style={{ color: draft.text, fontWeight: '900' }}>{t('transaction.detail')}</Text>
            <Text style={{ color: draft.secondary, fontSize: 13 }}>{t('types.expense')} · Food · USD</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {[0.7, 0.42, 0.9, 0.55].map((height, index) => (
                <View key={index} style={{ flex: 1, height: 54 * height, alignSelf: 'flex-end', borderRadius: 5, backgroundColor: index % 2 ? draft.secondary : draft.primary }} />
              ))}
            </View>
          </View>
          <View style={{ height: 46, borderRadius: draft.borderRadius, backgroundColor: draft.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#FFFFFF', fontWeight: '900' }}>{t('themeBuilder.sampleButton')}</Text>
          </View>
        </View>
        {!hasReadableContrast ? (
          <Text style={{ color: theme.colors.warning, fontSize: 13, lineHeight: 18 }}>{t('themeBuilder.contrastWarning')}</Text>
        ) : null}
      </Card>

      <SectionHeader title={t('themeBuilder.quickPalettes')} />
      <View style={{ gap: 10 }}>
        {palettes.map((palette) => (
          <Pressable key={palette.nameKey} accessibilityRole="button" onPress={() => updateDraft(palette.colors)}>
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={{ flex: 1, color: theme.colors.text, fontSize: 15, fontWeight: '900' }}>{t(palette.nameKey)}</Text>
              <View style={{ flexDirection: 'row', gap: 5 }}>
                {Object.values(palette.colors).filter((color): color is string => typeof color === 'string').slice(0, 5).map((color) => (
                  <View key={color} style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: color }} />
                ))}
              </View>
            </Card>
          </Pressable>
        ))}
      </View>

      <SectionHeader title={t('themeBuilder.colorPanel')} />
      <Card style={{ gap: 14 }}>
        <PickerField
          label={t('themeBuilder.editColor')}
          value={selectedField}
          onChange={setSelectedField}
          options={[...colorFields, ...advancedFields].map((field) => ({ label: t(`themeBuilder.${field}`), value: field, color: draft[field] }))}
        />
        <Text style={{ color: theme.colors.textMuted, fontSize: 13, fontWeight: '800' }}>{t('themeBuilder.swatches')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {swatches.map((color) => (
            <Pressable
              key={color}
              accessibilityRole="button"
              onPress={() => updateColor(selectedField, color)}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: color,
                borderWidth: draft[selectedField] === color ? 3 : 1,
                borderColor: draft[selectedField] === color ? theme.colors.text : theme.colors.border,
              }}
            />
          ))}
        </View>
        <Text style={{ color: theme.colors.textMuted, fontSize: 13, fontWeight: '800' }}>{t('themeBuilder.colorBar')}</Text>
        <View style={{ flexDirection: 'row', overflow: 'hidden', borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border }}>
          {swatches.map((color) => (
            <Pressable key={`bar-${color}`} onPress={() => updateColor(selectedField, color)} style={{ flex: 1, height: 28, backgroundColor: color }} />
          ))}
        </View>
        <TextField label={`${t('themeBuilder.hexCode')} (${t('common.optional')})`} value={draft[selectedField]} onChangeText={(value) => updateColor(selectedField, value)} />
      </Card>

      <SectionHeader title={t('themeBuilder.layout')} />
      <Card style={{ gap: 12 }}>
        <TextField label={t('themeBuilder.radius')} value={String(draft.borderRadius)} onChangeText={(value) => updateDraft({ borderRadius: Number(value) || 8 })} keyboardType="number-pad" />
        <PickerField
          label={t('themeBuilder.cardStyle')}
          value={draft.cardStyle}
          onChange={(cardStyle) => updateDraft({ cardStyle })}
          options={[
            { label: t('themeBuilder.flat'), value: 'flat' },
            { label: t('themeBuilder.soft'), value: 'soft' },
            { label: t('themeBuilder.elevated'), value: 'elevated' },
          ]}
        />
        <AppButton
          title={showAdvanced ? t('themeBuilder.hideAdvanced') : t('themeBuilder.showAdvanced')}
          icon="code-slash-outline"
          variant="secondary"
          onPress={() => setShowAdvanced((current) => !current)}
        />
        {showAdvanced ? (
          <View style={{ gap: 12 }}>
            {advancedFields.map((field) => (
              <TextField key={field} label={t(`themeBuilder.${field}`)} value={draft[field]} onChangeText={(value) => updateColor(field, value)} />
            ))}
          </View>
        ) : null}
      </Card>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <AppButton title={t('themeBuilder.save')} icon="checkmark-outline" onPress={save} style={{ flex: 1 }} />
        <AppButton title={t('themeBuilder.reset')} icon="refresh-outline" variant="secondary" onPress={() => setDraft(defaultCustomTheme)} style={{ flex: 1 }} />
      </View>
    </Screen>
  );
}
