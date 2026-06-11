import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { ChipGroup } from '../components/ChipGroup';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { SectionHeader } from '../components/SectionHeader';
import { BASE_CURRENCIES } from '../constants/currencies';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useFinance } from '../context/FinanceContext';
import { useI18n } from '../i18n/useI18n';
import type { BackupPayload, BaseCurrency } from '../types';
import { pickJsonFile, saveAndShareFile } from '../utils/files';

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

export function SettingsScreen() {
  const navigation = useNavigation();
  const { theme, settings, setBaseCurrency, updateSettings } = useAppPreferences();
  const { createCsv, createReportsCsv, createBackup, importBackup, clearData } = useFinance();
  const { t } = useI18n();
  const [confirmClear, setConfirmClear] = useState(false);

  const exportCsv = async () => {
    const uri = await saveAndShareFile(
      `finance-transactions-${stamp()}.csv`,
      createCsv(),
      'text/csv'
    );
    Alert.alert(t('settings.exported'), uri);
  };

  const exportReports = async () => {
    const uri = await saveAndShareFile(
      `finance-reports-${stamp()}.csv`,
      createReportsCsv(settings),
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
    try {
      const raw = await pickJsonFile();
      if (!raw) return;

      const payload = JSON.parse(raw) as BackupPayload;
      const importedSettings = await importBackup(payload);
      await updateSettings(importedSettings);
      Alert.alert(t('settings.imported'));
    } catch {
      Alert.alert(t('settings.importInvalid'));
    }
  };

  return (
    <Screen>
      <ScreenHeader title={t('settings.title')} subtitle={t('settings.version')} />

      <SectionHeader title={t('settings.appearance')} />
      <Card style={{ gap: 10 }}>
        <AppButton
          title={t('settings.themePicker')}
          icon="color-palette-outline"
          variant="secondary"
          onPress={() => navigation.navigate('ThemePicker' as never)}
        />
        <AppButton
          title={t('settings.languagePicker')}
          icon="language-outline"
          variant="secondary"
          onPress={() => navigation.navigate('LanguagePicker' as never)}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <Text style={{ color: theme.colors.textMuted, fontSize: 13, fontWeight: '800' }}>{t('settings.iconStyle')}</Text>
          <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '900' }}>{t('settings.lineIcons')}</Text>
        </View>
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
          icon="wallet-outline"
          variant="secondary"
          onPress={() => navigation.navigate('ManageWallets' as never)}
        />
        <AppButton
          title={t('settings.manageCategories')}
          icon="pricetags-outline"
          variant="secondary"
          onPress={() => navigation.navigate('ManageCategories' as never)}
        />
        <AppButton
          title={t('settings.manageExchangeRates')}
          icon="swap-horizontal-outline"
          variant="secondary"
          onPress={() => Alert.alert(t('settings.manageExchangeRates'), t('settings.baseCurrency'))}
        />
      </Card>

      <SectionHeader title={t('settings.backupRestore')} />
      <Card style={{ gap: 10 }}>
        <AppButton title={t('settings.exportCsv')} icon="document-text-outline" variant="secondary" onPress={exportCsv} />
        <AppButton title={t('settings.exportReportsCsv')} icon="analytics-outline" variant="secondary" onPress={exportReports} />
        <AppButton title={t('settings.backupJson')} icon="archive-outline" variant="secondary" onPress={backupJson} />
        <AppButton title={t('settings.importJson')} icon="cloud-upload-outline" variant="secondary" onPress={importJson} />
        <View style={{ height: 1, backgroundColor: theme.colors.border, marginVertical: 4 }} />
        <AppButton title={t('settings.clearData')} icon="trash-outline" variant="danger" onPress={() => setConfirmClear(true)} />
      </Card>

      <SectionHeader title={t('settings.about')} />
      <Card style={{ gap: 8 }}>
        <Text style={{ color: theme.colors.text, fontSize: 15, fontWeight: '900' }}>{t('settings.version')}</Text>
        <Text style={{ color: theme.colors.textMuted, fontSize: 13, lineHeight: 20 }}>{t('settings.apkUntouched')}</Text>
      </Card>

      <ConfirmDialog
        visible={confirmClear}
        title={t('settings.clearDataConfirmTitle')}
        body={t('settings.clearDataConfirmBody')}
        confirmLabel={t('common.clear')}
        cancelLabel={t('common.cancel')}
        destructive
        onCancel={() => setConfirmClear(false)}
        onConfirm={async () => {
          setConfirmClear(false);
          await clearData();
        }}
      />
    </Screen>
  );
}
