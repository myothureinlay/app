import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { BottomSheet } from '../components/BottomSheet';
import { ChipGroup } from '../components/ChipGroup';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { PickerField } from '../components/PickerField';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { TextField } from '../components/TextField';
import { WalletCard } from '../components/WalletCard';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useFinance } from '../context/FinanceContext';
import { useI18n } from '../i18n/useI18n';
import type { CurrencyCode, Wallet } from '../types';
import { parseNumber } from '../utils/money';

const walletColors = ['#16A7A0', '#FF8A4C', '#5E6AD2', '#22C55E', '#F5A524'];

export function ManageWalletsScreen() {
  const { theme } = useAppPreferences();
  const { wallets, currencies, addWallet, removeWalletById } = useFinance();
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('USDT');
  const [balance, setBalance] = useState('');
  const [color, setColor] = useState(walletColors[0]);
  const [removeTarget, setRemoveTarget] = useState<Wallet | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const currencyOptions = currencies.length > 0 ? currencies.filter((item) => item.isActive).map((item) => item.code) : ['USD', 'USDT', 'MMK', 'THB'];

  const closeForm = () => {
    setFormVisible(false);
    setName('');
    setBalance('');
    setColor(walletColors[0]);
  };

  const submit = async () => {
    if (!name.trim()) {
      Alert.alert(t('manage.walletName'));
      return;
    }

    await addWallet({
      name: name.trim(),
      currency,
      balance: parseNumber(balance),
      color,
      icon: currency === 'USDT' ? 'logo-bitcoin' : currency === 'USD' ? 'card-outline' : 'wallet-outline',
    });
    closeForm();
  };

  return (
    <Screen>
      <ScreenHeader
        title={t('nav.wallets')}
        subtitle={t('manage.walletsSubtitle')}
        action={<AppButton title="" icon="add-outline" onPress={() => setFormVisible(true)} style={{ width: 44, paddingHorizontal: 0 }} />}
      />

      <View style={{ gap: 12 }}>
        {wallets.length === 0 ? (
          <EmptyState
            title={t('empty.title')}
            body={t('empty.wallets')}
            icon="wallet-outline"
            actionLabel={t('manage.addWallet')}
            actionIcon="add-circle-outline"
            onAction={() => setFormVisible(true)}
          />
        ) : (
          wallets.map((wallet) => (
            <View key={wallet.id} style={{ gap: 8 }}>
              <WalletCard wallet={wallet} />
              <AppButton title={t('common.remove')} icon="trash-outline" variant="ghost" onPress={() => setRemoveTarget(wallet)} />
            </View>
          ))
        )}
      </View>
      <BottomSheet visible={formVisible} title={t('manage.addWallet')} onClose={closeForm}>
        <TextField label={t('manage.walletName')} value={name} onChangeText={setName} />
        <PickerField
          label={t('common.currency')}
          value={currency}
          onChange={setCurrency}
          options={currencyOptions.map((item) => ({ label: item, value: item, icon: 'cash-outline' }))}
          icon="cash-outline"
          searchable
        />
        <TextField label={t('common.balance')} value={balance} onChangeText={setBalance} keyboardType="decimal-pad" />
        <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '800' }}>{t('common.color')}</Text>
        <ChipGroup
          value={color}
          onChange={setColor}
          options={walletColors.map((item) => ({ label: ' ', value: item, color: item }))}
        />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <AppButton title={t('common.save')} icon="checkmark" onPress={submit} style={{ flex: 1 }} />
          <AppButton title={t('common.cancel')} variant="secondary" onPress={closeForm} style={{ flex: 1 }} />
        </View>
      </BottomSheet>
      <ConfirmDialog
        visible={Boolean(removeTarget)}
        title={t('manage.removeWallet')}
        body={t('manage.removeWalletBody')}
        confirmLabel={t('common.remove')}
        cancelLabel={t('common.cancel')}
        destructive
        onCancel={() => setRemoveTarget(null)}
        onConfirm={async () => {
          if (removeTarget) {
            const decision = await removeWalletById(removeTarget.id);
            Alert.alert(t('common.remove'), decision.warning ?? t('manage.walletRemoved'));
          }
          setRemoveTarget(null);
        }}
      />
    </Screen>
  );
}
