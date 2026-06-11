import { Text, View } from 'react-native';

import { useAppPreferences } from '../context/AppPreferencesContext';
import type { TransactionWithMeta } from '../types';
import { formatMoney } from '../utils/money';
import { Card } from './Card';

interface CategoryChartProps {
  transactions: TransactionWithMeta[];
}

export function CategoryChart({ transactions }: CategoryChartProps) {
  const { theme, settings } = useAppPreferences();
  const expenses = transactions.filter(
    (transaction) =>
      transaction.type === 'expense' && transaction.baseCurrency === settings.baseCurrency
  );
  const totals = expenses.reduce<Record<string, { name: string; color: string; total: number }>>(
    (acc, transaction) => {
      const key = transaction.categoryId ?? 'uncategorized';
      if (!acc[key]) {
        acc[key] = {
          name: transaction.categoryName ?? 'Uncategorized',
          color: transaction.categoryColor ?? theme.colors.accent,
          total: 0,
        };
      }
      acc[key].total += transaction.baseAmount;
      return acc;
    },
    {}
  );
  const rows = Object.values(totals).sort((a, b) => b.total - a.total).slice(0, 5);
  const max = Math.max(...rows.map((row) => row.total), 1);

  return (
    <Card style={{ gap: 14 }}>
      {rows.length === 0 ? (
        <Text style={{ color: theme.colors.textMuted, fontSize: 14 }}>No expense data yet.</Text>
      ) : (
        rows.map((row) => (
          <View key={row.name} style={{ gap: 7 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
              <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '800' }} numberOfLines={1}>
                {row.name}
              </Text>
              <Text style={{ color: theme.colors.textMuted, fontSize: 13, fontWeight: '700' }}>
                {formatMoney(row.total, settings.baseCurrency)}
              </Text>
            </View>
            <View
              style={{
                height: 9,
                borderRadius: 6,
                backgroundColor: theme.colors.surfaceElevated,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  width: `${Math.max(8, (row.total / max) * 100)}%`,
                  height: '100%',
                  backgroundColor: row.color,
                  borderRadius: 6,
                }}
              />
            </View>
          </View>
        ))
      )}
    </Card>
  );
}
