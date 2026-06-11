import { useNavigation } from '@react-navigation/native';
import { Alert, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { ChipGroup } from '../components/ChipGroup';
import { Screen } from '../components/Screen';
import { SectionHeader } from '../components/SectionHeader';
import { SegmentedControl } from '../components/SegmentedControl';
import { BASE_CURRENCIES } from '../constants/currencies';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useFinance } from '../context/FinanceContext';
import { useI18n } from '../i18n/useI18n';
import type { BackupPayload, BaseCurrency, LanguageCode, ThemePreference } from '../types';
import { pickJsonFile, saveAndShareFile } from '../utils/files';

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

export function SettingsScreen() {
  const navigation = useNavigation();
  const { theme, settings, setThemePreference, setLanguage, setBaseCurrency, updateSettings } =
    useAppPreferences();
  const { createCsv, createBackup, importBackup } = useFinance();
  const { t } = useI18n();

  const exportCsv = async () => {
    const uri = await saveAndShareFile(
      `finance-transactions-${stamp()}.csv`,
      createCsv(),
      'text/csv'
    );
    Alert.alert(t('settings.exported'), uri);
  };

  const backupJson = async () => {
    const payload = await createBackup(settings);
    const uri = await saveAndShareFile(
      `finance-backup-${stamp()}.json`,
      JSON.stringify(payload, null, 2),
      'application/json'
    );
    Alert.alert(t('settings.exported'), uri);
  };

  const importJson = async () => {
    const raw = await pickJsonFile();
    if (!raw) return;

    const payload = JSON.parse(raw) as BackupPayload;
    const importedSettings = await importBackup(payload);
    await updateSettings(importedSettings);
    Alert.alert(t('settings.imported'));
  };

  return (
    <Screen>
      <SectionHeader title={t('settings.title')} />

      <SectionHeader title={t('settings.appearance')} />
      <Card style={{ gap: 16 }}>
        <Text style={{ color: theme.colors.textMuted, fontSize: 13, fontWeight: '700' }}>{t('settings.theme')}</Text>
        <SegmentedControl
          value={settings.theme}
          onChange={(value) => setThemePreference(value as ThemePreference)}
          options={[
            { label: t('settings.system'), value: 'system', icon: 'phone-portrait' },
            { label: t('settings.light'), value: 'light', icon: 'sunny' },
            { label: t('settings.dark'), value: 'dark', icon: 'moon' },
          ]}
        />
        <Text style={{ color: theme.colors.textMuted, fontSize: 13, fontWeight: '700' }}>
          {t('settings.language')}
        </Text>
        <SegmentedControl
          value={settings.language}
          onChange={(value) => setLanguage(value as LanguageCode)}
          options={[
            { label: t('settings.english'), value: 'en' },
            { label: t('settings.burmese'), value: 'my' },
            { label: t('settings.thai'), value: 'th' },
          ]}
        />
      </Card>

      <SectionHeader title={t('settings.baseCurrency')} />
      <ChipGroup
        value={settings.baseCurrency}
        onChange={(value) => setBaseCurrency(value as BaseCurrency)}
        options={BASE_CURRENCIES.map((currency) => ({ label: currency, value: currency }))}
      />

      <SectionHeader title={t('settings.data')} />
      <Card style={{ gap: 10 }}>
        <AppButton
          title={t('settings.manageWallets')}
          icon="wallet"
          variant="secondary"
          onPress={() => navigation.navigate('ManageWallets' as never)}
        />
        <AppButton
          title={t('settings.manageCategories')}
          icon="pricetags"
          variant="secondary"
          onPress={() => navigation.navigate('ManageCategories' as never)}
        />
        <View style={{ height: 1, backgroundColor: theme.colors.border, marginVertical: 4 }} />
        <AppButton title={t('settings.exportCsv')} icon="document-text" variant="secondary" onPress={exportCsv} />
        <AppButton title={t('settings.backupJson')} icon="archive" variant="secondary" onPress={backupJson} />
        <AppButton title={t('settings.importJson')} icon="cloud-upload" variant="secondary" onPress={importJson} />
      </Card>
    </Screen>
  );
}
