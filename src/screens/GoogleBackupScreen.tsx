import { Alert, Text } from 'react-native';

import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { SectionHeader } from '../components/SectionHeader';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useFinance } from '../context/FinanceContext';
import { useI18n } from '../i18n/useI18n';

export function GoogleBackupScreen() {
  const { theme, settings, updateSettings } = useAppPreferences();
  const { backupMetadata } = useFinance();
  const { t } = useI18n();
  const google = backupMetadata.find((item) => item.provider === 'google');

  return (
    <Screen>
      <ScreenHeader title={t('google.title')} subtitle={t('google.subtitle')} />
      <Card style={{ gap: 10 }}>
        <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '900' }}>{t('google.status')}</Text>
        <Text style={{ color: theme.colors.textMuted, fontSize: 14, lineHeight: 20 }}>
          {google?.details ?? t('google.scaffolded')}
        </Text>
        <AppButton title={t('google.connect')} icon="logo-google" onPress={() => Alert.alert(t('google.setupRequired'), t('google.setupBody'))} />
      </Card>

      <SectionHeader title={t('google.backupOptions')} />
      <Card style={{ gap: 10 }}>
        <AppButton title={t('google.sheets')} icon="grid-outline" variant="secondary" onPress={() => Alert.alert(t('google.setupRequired'))} />
        <AppButton title={t('google.drive')} icon="cloud-outline" variant="secondary" onPress={() => Alert.alert(t('google.setupRequired'))} />
        <AppButton title={t('google.restorePreview')} icon="eye-outline" variant="secondary" onPress={() => Alert.alert(t('google.setupRequired'))} />
      </Card>

      <SectionHeader title={t('google.autoBackup')} />
      <Card style={{ gap: 10 }}>
        {(['off', 'daily', 'weekly', 'monthly'] as const).map((mode) => (
          <AppButton
            key={mode}
            title={t(`google.${mode}`)}
            icon={settings.googleAutoBackup === mode ? 'checkmark-circle-outline' : 'ellipse-outline'}
            variant={settings.googleAutoBackup === mode ? 'primary' : 'secondary'}
            onPress={() => updateSettings({ googleAutoBackup: mode })}
          />
        ))}
      </Card>
    </Screen>
  );
}
