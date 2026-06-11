import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { useAppPreferences } from '../context/AppPreferencesContext';
import type { Wallet } from '../types';
import { formatMoney } from '../utils/money';
import { Card } from './Card';

interface WalletCardProps {
  wallet: Wallet;
}

export function WalletCard({ wallet }: WalletCardProps) {
  const { theme } = useAppPreferences();

  return (
    <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 8,
          backgroundColor: `${wallet.color}22`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={wallet.icon as never} size={20} color={wallet.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '800' }}>{wallet.name}</Text>
        <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>{wallet.currency}</Text>
      </View>
      <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '900' }}>
        {formatMoney(wallet.balance, wallet.currency)}
      </Text>
    </Card>
  );
}
