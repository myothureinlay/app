import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { ChipGroup } from '../components/ChipGroup';
import { Screen } from '../components/Screen';
import { SectionHeader } from '../components/SectionHeader';
import { StatCard } from '../components/StatCard';
import { WalletCard } from '../components/WalletCard';
import { CURRENCIES } from '../constants/currencies';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useFinance } from '../context/FinanceContext';
import { useI18n } from '../i18n/useI18n';
import type { CurrencyCode, TransactionWithMeta } from '../types';
import { endOfMonth, formatMonth, shiftMonth, startOfMonth } from '../utils/dates';
import { formatMoney } from '../utils/money';

function inMonth(transaction: TransactionWithMeta, month: Date) {
  const date = new Date(transaction.date);
  return date >= startOfMonth(month) && date <= endOfMonth(month);
}

function groupByCurrency(transactions: TransactionWithMeta[], type: 'income' | 'expense') {
  return CURRENCIES.map((currency) => ({
    currency,
    total: transactions
      .filter((transaction) => transaction.type === type && transaction.currency === currency)
      .reduce((sum, transaction) => sum + transaction.amount, 0),
  })).filter((row) => row.total > 0);
}

function groupExpenseCategories(transactions: TransactionWithMeta[], baseCurrency: string) {
  const totals = transactions
    .filter((transaction) => transaction.type === 'expense' && transaction.baseCurrency === baseCurrency)
    .reduce<Record<string, { name: string; color: string; total: number }>>((acc, transaction) => {
      const key = transaction.categoryId ?? 'uncategorized';
      if (!acc[key]) {
        acc[key] = {
          name: transaction.categoryName ?? 'Uncategorized',
          color: transaction.categoryColor ?? '#FF8A4C',
          total: 0,
        };
      }
      acc[key].total += transaction.baseAmount;
      return acc;
    }, {});
  return Object.values(totals).sort((a, b) => b.total - a.total);
}

export function ReportsScreen() {
  const { theme, settings } = useAppPreferences();
  const { wallets, categories, transactions } = useFinance();
  const { t, locale } = useI18n();
  const [month, setMonth] = useState(startOfMonth());
  const [currency, setCurrency] = useState<'all' | CurrencyCode>('all');
  const [categoryId, setCategoryId] = useState('all');
  const [walletId, setWalletId] = useState('all');

  const filtered = useMemo(
    () =>
      transactions.filter((transaction) => {
        if (!inMonth(transaction, month)) return false;
        if (currency !== 'all' && transaction.currency !== currency) return false;
        if (categoryId !== 'all' && transaction.categoryId !== categoryId) return false;
        if (walletId !== 'all' && transaction.walletId !== walletId && transaction.toWalletId !== walletId) {
          return false;
        }
        return true;
      }),
    [transactions, month, currency, categoryId, walletId]
  );

  const summaryCurrency = currency === 'all' ? settings.baseCurrency : currency;
  const summaryRelevant = filtered.filter((transaction) =>
    currency === 'all' ? transaction.baseCurrency === settings.baseCurrency : transaction.currency === currency
  );
  const income = summaryRelevant
    .filter((transaction) => transaction.type === 'income')
    .reduce((sum, transaction) => sum + (currency === 'all' ? transaction.baseAmount : transaction.amount), 0);
  const expenses = summaryRelevant
    .filter((transaction) => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + (currency === 'all' ? transaction.baseAmount : transaction.amount), 0);
  const incomeByCurrency = groupByCurrency(filtered, 'income');
  const expenseByCurrency = groupByCurrency(filtered, 'expense');
  const expenseByCategory = groupExpenseCategories(filtered, settings.baseCurrency);

  return (
    <Screen>
      <SectionHeader title={t('reports.title')} />

      <Card style={{ gap: 14 }}>
        <Text style={{ color: theme.colors.textMuted, fontSize: 13, fontWeight: '700' }}>{t('common.month')}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <AppButton title="" icon="chevron-back" variant="secondary" onPress={() => setMonth(shiftMonth(month, -1))} />
          <Text
            style={{ flex: 1, color: theme.colors.text, fontSize: 18, fontWeight: '900', textAlign: 'center' }}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {formatMonth(month, locale)}
          </Text>
          <AppButton title="" icon="chevron-forward" variant="secondary" onPress={() => setMonth(shiftMonth(month, 1))} />
        </View>
      </Card>

      <SectionHeader title={t('reports.filters')} />
      <ChipGroup
        value={currency}
        onChange={setCurrency}
        options={[
          { label: t('common.all'), value: 'all' },
          ...CURRENCIES.map((item) => ({ label: item, value: item })),
        ]}
      />
      <ChipGroup
        value={categoryId}
        onChange={setCategoryId}
        options={[
          { label: t('common.all'), value: 'all' },
          ...categories.map((category) => ({
            label: category.name,
            value: category.id,
            icon: category.icon,
            color: category.color,
          })),
        ]}
      />
      <ChipGroup
        value={walletId}
        onChange={setWalletId}
        options={[
          { label: t('common.all'), value: 'all' },
          ...wallets.map((wallet) => ({
            label: wallet.name,
            value: wallet.id,
            icon: wallet.icon,
            color: wallet.color,
          })),
        ]}
      />

      <SectionHeader title={t('reports.monthlySummary')} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <StatCard
          label={t('common.income')}
          value={income}
          currency={summaryCurrency}
          icon="arrow-down"
          color={theme.colors.success}
        />
        <StatCard
          label={t('common.expense')}
          value={expenses}
          currency={summaryCurrency}
          icon="arrow-up"
          color={theme.colors.danger}
        />
      </View>
      <StatCard
        label={t('common.balance')}
        value={income - expenses}
        currency={summaryCurrency}
        icon="analytics"
        color={theme.colors.primary}
      />

      <SectionHeader title={t('reports.incomeByCurrency')} />
      <Card style={{ gap: 12 }}>
        {incomeByCurrency.length === 0 ? (
          <Text style={{ color: theme.colors.textMuted }}>No income data.</Text>
        ) : (
          incomeByCurrency.map((row) => (
            <ReportRow key={row.currency} label={row.currency} value={formatMoney(row.total, row.currency)} />
          ))
        )}
      </Card>

      <SectionHeader title={t('reports.expenseByCurrency')} />
      <Card style={{ gap: 12 }}>
        {expenseByCurrency.length === 0 ? (
          <Text style={{ color: theme.colors.textMuted }}>No expense data.</Text>
        ) : (
          expenseByCurrency.map((row) => (
            <ReportRow key={row.currency} label={row.currency} value={formatMoney(row.total, row.currency)} />
          ))
        )}
      </Card>

      <SectionHeader title={t('reports.expenseByCategory')} />
      <Card style={{ gap: 12 }}>
        {expenseByCategory.length === 0 ? (
          <Text style={{ color: theme.colors.textMuted }}>No category data.</Text>
        ) : (
          expenseByCategory.map((row) => (
            <ReportRow
              key={row.name}
              label={row.name}
              value={formatMoney(row.total, settings.baseCurrency)}
              color={row.color}
            />
          ))
        )}
      </Card>

      <SectionHeader title={t('reports.walletBalances')} />
      {wallets.map((wallet) => (
        <WalletCard key={wallet.id} wallet={wallet} />
      ))}
    </Screen>
  );
}

function ReportRow({ label, value, color }: { label: string; value: string; color?: string }) {
  const { theme } = useAppPreferences();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: color ?? theme.colors.primary,
        }}
      />
      <Text style={{ flex: 1, color: theme.colors.text, fontSize: 15, fontWeight: '800' }} numberOfLines={1}>
        {label}
      </Text>
      <Text style={{ color: theme.colors.textMuted, fontSize: 14, fontWeight: '800' }}>{value}</Text>
    </View>
  );
}
