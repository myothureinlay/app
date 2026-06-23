import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { useAppPreferences } from '../context/AppPreferencesContext';
import { formatTransactionBaseAmount, formatTransactionPrimaryAmount } from '../logic/transactionDisplay';
import { isExpenseLike, isIncomeLike, transactionTypeIcons } from '../logic/ledger';
import type { TransactionWithMeta } from '../types';
import { formatDate } from '../utils/dates';

interface TransactionItemProps {
  transaction: TransactionWithMeta;
  onPress?: () => void;
}

export function TransactionItem({ transaction, onPress }: TransactionItemProps) {
  const { theme, settings } = useAppPreferences();
  const isExpense = isExpenseLike(transaction.type) || transaction.type === 'loss';
  const isIncome = isIncomeLike(transaction.type);
  const color = isIncome ? theme.colors.success : isExpense ? theme.colors.danger : theme.colors.secondary;
  const title = transaction.categoryName ?? transaction.type.replace(/_/g, ' ');
  const baseAmountLabel = formatTransactionBaseAmount(transaction);
  const locale =
    settings.language === 'th'
      ? 'th-TH'
      : settings.language === 'my'
        ? 'my-MM'
        : settings.language === 'zh-Hans'
          ? 'zh-CN'
          : 'en-US';

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 8,
        opacity: pressed ? 0.76 : 1,
      })}
    >
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
        <Ionicons name={(transaction.categoryIcon ?? transactionTypeIcons[transaction.type]) as never} size={20} color={color} />
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
      <View style={{ alignItems: 'flex-end', gap: 3, minWidth: 104, maxWidth: '42%' }}>
        <Text style={{ color, fontSize: 14, fontWeight: '900' }} numberOfLines={1} adjustsFontSizeToFit>
          {formatTransactionPrimaryAmount(transaction)}
        </Text>
        {baseAmountLabel ? (
          <Text style={{ color: theme.colors.textMuted, fontSize: 11 }} numberOfLines={1} adjustsFontSizeToFit>
            {baseAmountLabel}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
