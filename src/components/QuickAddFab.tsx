import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppPreferences } from '../context/AppPreferencesContext';
import { useI18n } from '../i18n/useI18n';
import type { TransactionType } from '../types';
import { BottomSheet } from './BottomSheet';
import { Card } from './Card';

const actions: Array<{ key: string; icon: string; route?: TransactionType }> = [
  { key: 'addIncome', icon: 'trending-up-outline', route: 'income' },
  { key: 'addExpense', icon: 'trending-down-outline', route: 'expense' },
  { key: 'addTransfer', icon: 'repeat-outline', route: 'transfer' },
  { key: 'addExchange', icon: 'swap-horizontal-outline', route: 'exchange' },
  { key: 'addInvestment', icon: 'bar-chart-outline', route: 'investment' },
  { key: 'addAdjustment', icon: 'options-outline', route: 'adjustment' },
  { key: 'addLoanDebt', icon: 'cash-outline', route: 'loan_given' },
];

export function QuickAddFab() {
  const navigation = useNavigation<any>();
  const { theme } = useAppPreferences();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);

  const openAction = (type: TransactionType) => {
    setVisible(false);
    navigation.navigate('AddTransaction', { initialType: type });
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('records.addRecord')}
        onPress={() => setVisible(true)}
        style={({ pressed }) => [
          styles.fab,
          {
            bottom: Math.max(insets.bottom, 12) + 84,
            backgroundColor: Platform.OS === 'ios' ? `${theme.colors.surface}DD` : theme.colors.primary,
            borderColor: `${theme.colors.primary}88`,
            shadowColor: theme.colors.shadow,
            opacity: pressed ? 0.82 : 1,
          },
        ]}
      >
        <Ionicons name="add-outline" size={30} color={Platform.OS === 'ios' ? theme.colors.primary : '#FFFFFF'} />
      </Pressable>

      <BottomSheet visible={visible} title={t('records.addRecord')} onClose={() => setVisible(false)}>
        <View style={{ gap: 8 }}>
          {actions.map((action) => (
            <Pressable key={action.key} accessibilityRole="button" onPress={() => action.route && openAction(action.route)}>
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 }}>
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: `${theme.colors.primary}18`,
                  }}
                >
                  <Ionicons name={action.icon as never} size={20} color={theme.colors.primary} />
                </View>
                <Text style={{ flex: 1, color: theme.colors.text, fontSize: 15, fontWeight: '900' }}>
                  {t(`records.${action.key}`)}
                </Text>
                <Ionicons name="chevron-forward-outline" size={18} color={theme.colors.textMuted} />
              </Card>
            </Pressable>
          ))}
        </View>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
    zIndex: 20,
  },
});
