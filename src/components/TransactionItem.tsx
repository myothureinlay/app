import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { useAppPreferences } from '../context/AppPreferencesContext';
import type { TransactionWithMeta } from '../types';
import { formatDate } from '../utils/dates';
import { formatMoney } from '../utils/money';

interface TransactionItemProps {
  transaction: TransactionWithMeta;
}

export function TransactionItem({ transaction }: TransactionItemProps) {
  const { theme, settings } = useAppPreferences();
  const isExpense = transaction.type === 'expense';
  const isIncome = transaction.type === 'income';
  const color = isIncome ? theme.colors.success : isExpense ? theme.colors.danger : theme.colors.secondary;
  const title = transaction.categoryName ?? (transaction.type === 'transfer' ? 'Transfer' : 'Transaction');
  const locale = settings.language === 'th' ? 'th-TH' : settings.language === 'my' ? 'my-MM' : 'en-US';

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 }}>
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 8,
          backgroundColor: `${color}22`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={(transaction.categoryIcon ?? 'swap-horizontal') as never} size={20} color={color} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ color: theme.colors.text, fontSize: 15, fontWeight: '800' }} numberOfLines={1}>
          {title}
        </Text>
        <Text style={{ color: theme.colors.textMuted, fontSize: 12 }} numberOfLines={1}>
          {transaction.walletName}
          {transaction.toWalletName ? ` -> ${transaction.toWalletName}` : ''} · {formatDate(transaction.date, locale)}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 3 }}>
        <Text style={{ color, fontSize: 15, fontWeight: '900' }} numberOfLines={1}>
          {isExpense ? '-' : isIncome ? '+' : ''}
          {formatMoney(transaction.amount, transaction.currency)}
        </Text>
        <Text style={{ color: theme.colors.textMuted, fontSize: 11 }}>
          {formatMoney(transaction.baseAmount, transaction.baseCurrency)}
        </Text>
      </View>
    </View>
  );
}
