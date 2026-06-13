import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { PickerField } from '../components/PickerField';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { SectionHeader } from '../components/SectionHeader';
import { BUILD_INFO } from '../constants/build';
import { getCurrencyBadge } from '../constants/currencies';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useFinance } from '../context/FinanceContext';
import { useI18n } from '../i18n/useI18n';
import type { BackupPayload, BaseCurrency, IconStyle } from '../types';
import { pickJsonFile, saveAndShareFile } from '../utils/files';

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

export function SettingsScreen() {
  const navigation = useNavigation();
  const { theme, settings, setBaseCurrency, updateSettings } = useAppPreferences();
  const { createCsv, createBackup, importBackup, clearData, currencies } = useFinance();
  const { t } = useI18n();
  const [confirmClear, setConfirmClear] = useState(false);
  const baseCurrencyOptions = currencies.filter((currency) => currency.isActive).map((currency) => currency.code);

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
        <PickerField
          label={t('settings.iconStyle')}
          value={settings.iconStyle}
          onChange={(iconStyle) => updateSettings({ iconStyle: iconStyle as IconStyle })}
          options={[
            { label: t('settings.lineIcons'), value: 'line', icon: 'ellipse-outline', color: theme.colors.primary },
            { label: t('settings.filledIcons'), value: 'filled', icon: 'ellipse', color: theme.colors.secondary },
          ]}
          icon="sparkles-outline"
        />
      </Card>

      <SectionHeader title={t('settings.baseCurrency')} />
      <Card>
        <PickerField
          label={t('settings.baseCurrency')}
          value={settings.baseCurrency}
          onChange={(value) => setBaseCurrency(value as BaseCurrency)}
          options={(baseCurrencyOptions.includes(settings.baseCurrency) ? baseCurrencyOptions : [settings.baseCurrency, ...baseCurrencyOptions]).map((currency) => ({ label: currency, value: currency, icon: 'cash-outline', badge: getCurrencyBadge(currency) }))}
          icon="cash-outline"
          searchable
        />
      </Card>

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
        <AppButton
          title={t('settings.manageCurrencies')}
          icon="cash-outline"
          variant="secondary"
          onPress={() => navigation.navigate('ManageCurrencies' as never)}
        />
        <AppButton
          title={t('settings.budgets')}
          icon="speedometer-outline"
          variant="secondary"
          onPress={() => navigation.navigate('Budgets' as never)}
        />
        <AppButton
          title={t('settings.goals')}
          icon="flag-outline"
          variant="secondary"
          onPress={() => navigation.navigate('Goals' as never)}
        />
      </Card>

      <SectionHeader title={t('settings.backupRestore')} />
      <Card style={{ gap: 10 }}>
        <AppButton title={t('settings.exportCsv')} icon="document-text-outline" variant="secondary" onPress={exportCsv} />
        <AppButton title={t('settings.backupJson')} icon="archive-outline" variant="secondary" onPress={backupJson} />
        <AppButton title={t('settings.importJson')} icon="cloud-upload-outline" variant="secondary" onPress={importJson} />
        <AppButton
          title={t('settings.googleBackup')}
          icon="logo-google"
          variant="secondary"
          onPress={() => navigation.navigate('GoogleBackup' as never)}
        />
        <View style={{ height: 1, backgroundColor: theme.colors.border, marginVertical: 4 }} />
        <AppButton title={t('settings.clearData')} icon="trash-outline" variant="danger" onPress={() => setConfirmClear(true)} />
      </Card>

      <SectionHeader title={t('settings.about')} />
      <Card style={{ gap: 10 }}>
        <AppButton
          title={t('settings.userManual')}
          icon="book-outline"
          variant="secondary"
          onPress={() => navigation.navigate('UserManual' as never)}
        />
        <AppButton
          title={t('settings.notifications')}
          icon="notifications-outline"
          variant="secondary"
          onPress={() => navigation.navigate('Notifications' as never)}
        />
        <AppButton
          title={t('settings.aboutApp')}
          icon="information-circle-outline"
          variant="secondary"
          onPress={() => navigation.navigate('About' as never)}
        />
      </Card>

      <Card style={{ gap: 6, backgroundColor: `${theme.colors.primary}12`, borderColor: `${theme.colors.primary}44` }}>
        <Text style={{ color: theme.colors.primary, fontSize: 13, fontWeight: '900' }}>{BUILD_INFO.shortLabel}</Text>
        <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>
          {t('about.version')}: {BUILD_INFO.appVersion} · {t('about.buildDate')}: {BUILD_INFO.buildDate}
        </Text>
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
