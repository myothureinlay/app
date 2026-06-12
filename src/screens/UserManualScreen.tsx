import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useI18n } from '../i18n/useI18n';

const manualSections = [
  { key: 'gettingStarted', icon: 'rocket-outline' },
  { key: 'wallets', icon: 'wallet-outline' },
  { key: 'currencies', icon: 'cash-outline' },
  { key: 'incomeExpenses', icon: 'swap-vertical-outline' },
  { key: 'currencyExchange', icon: 'repeat-outline' },
  { key: 'categories', icon: 'pricetags-outline' },
  { key: 'budgets', icon: 'speedometer-outline' },
  { key: 'goals', icon: 'flag-outline' },
  { key: 'reportsDatePicker', icon: 'calendar-outline' },
  { key: 'exports', icon: 'download-outline' },
  { key: 'backupRestore', icon: 'archive-outline' },
  { key: 'themesIconStyle', icon: 'color-palette-outline' },
  { key: 'notifications', icon: 'notifications-outline' },
  { key: 'troubleshooting', icon: 'construct-outline' },
  { key: 'apkInstall', icon: 'phone-portrait-outline' },
];

export function UserManualScreen() {
  const { theme } = useAppPreferences();
  const { t } = useI18n();
  const [openKey, setOpenKey] = useState(manualSections[0].key);

  return (
    <Screen>
      <ScreenHeader title={t('manual.title')} subtitle={t('manual.subtitle')} />

      {manualSections.map((section) => {
        const isOpen = openKey === section.key;
        return (
          <Card key={section.key} style={{ padding: 0, overflow: 'hidden' }}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setOpenKey(isOpen ? '' : section.key)}
              style={({ pressed }) => ({
                minHeight: 54,
                paddingHorizontal: 14,
                paddingVertical: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                backgroundColor: pressed ? theme.colors.surfaceElevated : theme.colors.surface,
              })}
            >
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: `${theme.colors.primary}18`,
                }}
              >
                <Ionicons name={section.icon as never} size={18} color={theme.colors.primary} />
              </View>
              <Text style={{ flex: 1, color: theme.colors.text, fontSize: 15, fontWeight: '900' }}>
                {t(`manual.${section.key}.title`)}
              </Text>
              <Ionicons name={isOpen ? 'chevron-up-outline' : 'chevron-down-outline'} size={18} color={theme.colors.textMuted} />
            </Pressable>
            {isOpen ? (
              <View style={{ borderTopWidth: 1, borderTopColor: theme.colors.border, padding: 14, gap: 8 }}>
                <Text style={{ color: theme.colors.textMuted, fontSize: 14, lineHeight: 21 }}>
                  {t(`manual.${section.key}.body`)}
                </Text>
              </View>
            ) : null}
          </Card>
        );
      })}
    </Screen>
  );
}
