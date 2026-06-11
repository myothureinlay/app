import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { ChipGroup } from '../components/ChipGroup';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Screen } from '../components/Screen';
import { TextField } from '../components/TextField';
import { WalletCard } from '../components/WalletCard';
import { CURRENCIES } from '../constants/currencies';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useFinance } from '../context/FinanceContext';
import { useI18n } from '../i18n/useI18n';
import type { CurrencyCode, Wallet } from '../types';
import { parseNumber } from '../utils/money';

const walletColors = ['#16A7A0', '#FF8A4C', '#5E6AD2', '#22C55E', '#F5A524'];

export function ManageWalletsScreen() {
  const { theme } = useAppPreferences();
  const { wallets, addWallet, removeWalletById } = useFinance();
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('USDT');
  const [balance, setBalance] = useState('');
  const [color, setColor] = useState(walletColors[0]);
  const [removeTarget, setRemoveTarget] = useState<Wallet | null>(null);

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
    setName('');
    setBalance('');
  };

  return (
    <Screen>
      <Card style={{ gap: 16 }}>
        <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '900' }}>{t('manage.addWallet')}</Text>
        <TextField label={t('manage.walletName')} value={name} onChangeText={setName} />
        <ChipGroup value={currency} onChange={setCurrency} options={CURRENCIES.map((item) => ({ label: item, value: item }))} />
        <TextField label={t('common.balance')} value={balance} onChangeText={setBalance} keyboardType="decimal-pad" />
        <ChipGroup
          value={color}
          onChange={setColor}
          options={walletColors.map((item) => ({ label: ' ', value: item, color: item }))}
        />
        <AppButton title={t('common.save')} icon="checkmark" onPress={submit} />
      </Card>

      <View style={{ gap: 12 }}>
        {wallets.map((wallet) => (
          <View key={wallet.id} style={{ gap: 8 }}>
            <WalletCard wallet={wallet} />
            <AppButton title={t('common.remove')} icon="trash-outline" variant="danger" onPress={() => setRemoveTarget(wallet)} />
          </View>
        ))}
      </View>
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
