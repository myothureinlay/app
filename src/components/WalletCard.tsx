import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { useAppPreferences } from '../context/AppPreferencesContext';
import type { Wallet } from '../types';
import { getCurrencyBadge } from '../constants/currencies';
import { iconForStyle } from '../utils/icons';
import { formatMoney } from '../utils/money';
import { Card } from './Card';

interface WalletCardProps {
  wallet: Wallet;
}

export function WalletCard({ wallet }: WalletCardProps) {
  const { theme, settings } = useAppPreferences();

  return (
    <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 104, padding: 14 }}>
      <View
        style={{
          width: 46,
          height: 46,
          borderRadius: theme.radius.md,
          backgroundColor: `${wallet.color}22`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={iconForStyle(wallet.icon || 'wallet-outline', settings.iconStyle) as never} size={20} color={wallet.color} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ color: theme.colors.text, fontSize: 15, fontWeight: '900' }} numberOfLines={1}>
          {wallet.name}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 5 }}>
          <View
            style={{
              minWidth: 28,
              height: 22,
              paddingHorizontal: 6,
              borderRadius: 7,
              backgroundColor: theme.colors.surfaceElevated,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: theme.colors.primary, fontSize: 11, fontWeight: '900' }} numberOfLines={1}>
              {getCurrencyBadge(wallet.currency)}
            </Text>
          </View>
          <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '800' }} numberOfLines={1}>
            {wallet.currency}
          </Text>
        </View>
      </View>
      <Text style={{ color: theme.colors.text, fontSize: 15, fontWeight: '900', maxWidth: 120, textAlign: 'right' }} numberOfLines={1} adjustsFontSizeToFit>
        {formatMoney(wallet.balance, wallet.currency)}
      </Text>
    </Card>
  );
}
