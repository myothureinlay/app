import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { PickerField } from '../components/PickerField';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { SectionHeader } from '../components/SectionHeader';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useFinance } from '../context/FinanceContext';
import { useI18n } from '../i18n/useI18n';
import { saveAndShareFile } from '../utils/files';

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

type ConnectionState = 'not_connected' | 'connecting' | 'failed';

export function GoogleBackupScreen() {
  const { theme, settings, updateSettings } = useAppPreferences();
  const { backupMetadata, createBackup } = useFinance();
  const { t } = useI18n();
  const [connectionState, setConnectionState] = useState<ConnectionState>('not_connected');
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null);
  const google = backupMetadata.find((item) => item.provider === 'google');
  const failed = connectionState === 'failed';

  const connect = async () => {
    setConnectionState('connecting');
    await new Promise((resolve) => setTimeout(resolve, 450));
    setConnectionState('failed');
    Alert.alert(t('google.setupRequired'), t('google.setupBody'));
  };

  const localBackup = async () => {
    setBackupInProgress(true);
    try {
      const payload = await createBackup(settings);
      const uri = await saveAndShareFile(`finance-google-ready-backup-${stamp()}.json`, JSON.stringify(payload, null, 2), 'application/json');
      setLastBackupAt(new Date().toISOString());
      Alert.alert(t('settings.exported'), uri);
    } finally {
      setBackupInProgress(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader title={t('google.title')} subtitle={t('google.subtitle')} />
      <Card style={{ gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: 23,
              backgroundColor: failed ? `${theme.colors.warning}22` : `${theme.colors.primary}18`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name={failed ? 'alert-circle-outline' : 'cloud-offline-outline'} size={24} color={failed ? theme.colors.warning : theme.colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '900' }}>
              {connectionState === 'connecting' ? t('google.connecting') : failed ? t('google.connectionFailed') : t('google.notConnected')}
            </Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: 13, lineHeight: 19, marginTop: 3 }}>
              {failed ? t('google.setupBody') : google?.details ?? t('google.scaffolded')}
            </Text>
          </View>
        </View>
        <AppButton
          title={connectionState === 'connecting' ? t('google.connecting') : t('google.connect')}
          icon="logo-google"
          onPress={connect}
          disabled={connectionState === 'connecting'}
        />
      </Card>

      <SectionHeader title={t('google.backupOptions')} />
      <Card style={{ gap: 10 }}>
        <AppButton
          title={backupInProgress ? t('google.backupInProgress') : t('google.localBackup')}
          icon="archive-outline"
          variant="secondary"
          onPress={localBackup}
          disabled={backupInProgress}
        />
        <AppButton title={t('google.sheets')} icon="grid-outline" variant="secondary" onPress={() => Alert.alert(t('google.setupRequired'), t('google.setupBody'))} />
        <AppButton title={t('google.drive')} icon="cloud-outline" variant="secondary" onPress={() => Alert.alert(t('google.setupRequired'), t('google.setupBody'))} />
        <AppButton title={t('google.restorePreview')} icon="eye-outline" variant="secondary" onPress={() => Alert.alert(t('google.setupRequired'), t('google.setupBody'))} />
        <Text style={{ color: theme.colors.textMuted, fontSize: 13, lineHeight: 19 }}>
          {t('google.lastBackup')}: {lastBackupAt ? new Date(lastBackupAt).toLocaleString() : t('google.never')}
        </Text>
      </Card>

      <SectionHeader title={t('google.autoBackup')} />
      <Card style={{ gap: 10 }}>
        <PickerField
          label={t('google.autoBackup')}
          value={settings.googleAutoBackup ?? 'off'}
          onChange={(googleAutoBackup) => updateSettings({ googleAutoBackup })}
          options={(['off', 'daily', 'weekly', 'monthly'] as const).map((mode) => ({
            label: t(`google.${mode}`),
            value: mode,
          }))}
        />
        <Text style={{ color: theme.colors.textMuted, fontSize: 13, lineHeight: 19 }}>{t('google.autoBackupDisabled')}</Text>
      </Card>
    </Screen>
  );
}
