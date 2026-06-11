import { useNavigation } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import {
  ChartCard,
  DonutChart,
  HorizontalBarChart,
  LineTrendChart,
  MonthlyBarChart,
} from '../components/ChartCard';
import { ChipGroup } from '../components/ChipGroup';
import { EmptyState } from '../components/EmptyState';
import { ReportCard } from '../components/ReportCard';
import { Screen } from '../components/Screen';
import { SectionHeader } from '../components/SectionHeader';
import { TransactionItem } from '../components/TransactionItem';
import { WalletCard } from '../components/WalletCard';
import { CURRENCIES } from '../constants/currencies';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useFinance } from '../context/FinanceContext';
import { useI18n } from '../i18n/useI18n';
import {
  calculateReportSummary,
  groupExpensesByCurrency,
  groupTransactionsByCategory,
  historyByTypes,
  monthlyIncomeExpense,
  topIndividualExpenses,
  walletDistribution,
} from '../logic/reports';
import type { CurrencyCode, TransactionWithMeta } from '../types';
import { endOfMonth, formatMonth, shiftMonth, startOfMonth } from '../utils/dates';
import { formatMoney } from '../utils/money';

type RangeMode = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

function inMonth(transaction: TransactionWithMeta, month: Date) {
  const date = new Date(transaction.date);
  return date >= startOfMonth(month) && date <= endOfMonth(month);
}

function inRangeMode(transaction: TransactionWithMeta, mode: RangeMode, month: Date) {
  const date = new Date(transaction.date);
  const now = new Date();
  if (mode === 'daily') return date.toDateString() === now.toDateString();
  if (mode === 'weekly') {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    return date >= weekStart && date <= now;
  }
  if (mode === 'yearly') return date.getFullYear() === now.getFullYear();
  return inMonth(transaction, month);
}

export function ReportsScreen() {
  const navigation = useNavigation<any>();
  const { theme, settings } = useAppPreferences();
  const { wallets, categories, transactions } = useFinance();
  const { t, locale } = useI18n();
  const [month, setMonth] = useState(startOfMonth());
  const [rangeMode, setRangeMode] = useState<RangeMode>('monthly');
  const [currency, setCurrency] = useState<'all' | CurrencyCode>('all');
  const [categoryId, setCategoryId] = useState('all');
  const [walletId, setWalletId] = useState('all');

  const filtered = useMemo(
    () =>
      transactions.filter((transaction) => {
        if (!inRangeMode(transaction, rangeMode, month)) return false;
        if (currency !== 'all' && transaction.currency !== currency) return false;
        if (categoryId !== 'all' && transaction.categoryId !== categoryId) return false;
        if (walletId !== 'all' && transaction.walletId !== walletId && transaction.toWalletId !== walletId) {
          return false;
        }
        return true;
      }),
    [transactions, rangeMode, month, currency, categoryId, walletId]
  );

  const summary = calculateReportSummary(filtered, settings.baseCurrency);
  const trend = monthlyIncomeExpense(transactions, settings.baseCurrency, 12);
  const expenseByCategory = groupTransactionsByCategory(filtered, settings.baseCurrency, 'expense');
  const incomeByCategory = groupTransactionsByCategory(filtered, settings.baseCurrency, 'income');
  const expenseByCurrency = groupExpensesByCurrency(filtered);
  const walletRows = walletDistribution(wallets, settings.baseCurrency);
  const topExpenses = topIndividualExpenses(filtered, settings.baseCurrency, 8);
  const exchangeHistory = historyByTypes(filtered, ['exchange', 'transfer'], settings.baseCurrency, 8);
  const loanHistory = historyByTypes(
    filtered,
    ['loan_given', 'loan_received', 'loan_repayment_paid', 'loan_repayment_received'],
    settings.baseCurrency,
    8
  );

  return (
    <Screen>
      <SectionHeader title={t('reports.title')} />

      <ChipGroup
        value={rangeMode}
        onChange={setRangeMode}
        options={[
          { label: t('reports.dailySummary'), value: 'daily' },
          { label: t('reports.weeklySummary'), value: 'weekly' },
          { label: t('reports.monthlySummary'), value: 'monthly' },
          { label: t('reports.yearlySummary'), value: 'yearly' },
          { label: t('reports.customRange'), value: 'custom' },
        ]}
      />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <AppButton title="" icon="chevron-back-outline" variant="secondary" onPress={() => setMonth(shiftMonth(month, -1))} />
        <Text
          style={{ flex: 1, color: theme.colors.text, fontSize: 18, fontWeight: '900', textAlign: 'center' }}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {formatMonth(month, locale)}
        </Text>
        <AppButton title="" icon="chevron-forward-outline" variant="secondary" onPress={() => setMonth(shiftMonth(month, 1))} />
      </View>

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
        <ReportCard label={t('common.income')} value={summary.income} currency={settings.baseCurrency} icon="trending-up-outline" color={theme.colors.success} />
        <ReportCard label={t('common.expense')} value={summary.expenses} currency={settings.baseCurrency} icon="trending-down-outline" color={theme.colors.danger} />
      </View>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <ReportCard label={t('reports.lossSummary')} value={summary.losses} currency={settings.baseCurrency} icon="alert-circle-outline" color={theme.colors.danger} />
        <ReportCard label={t('dashboard.netCashflow')} value={summary.netCashflow} currency={settings.baseCurrency} icon="pulse-outline" color={summary.netCashflow >= 0 ? theme.colors.success : theme.colors.danger} />
      </View>

      <ChartCard title={t('reports.incomeVsExpense')}>
        <MonthlyBarChart data={trend} />
      </ChartCard>

      <ChartCard title={t('reports.monthlyCashflowTrend')}>
        <LineTrendChart data={trend} />
      </ChartCard>

      <ChartCard title={t('reports.expenseByCategory')}>
        {expenseByCategory.length === 0 ? (
          <EmptyState title={t('empty.title')} body={t('empty.reports')} />
        ) : (
          <DonutChart data={expenseByCategory.map((row) => ({ ...row, value: row.total }))} />
        )}
      </ChartCard>

      <ChartCard title={t('reports.topExpenseCategories')}>
        <HorizontalBarChart data={expenseByCategory.map((row) => ({ ...row, value: row.total }))} currency={settings.baseCurrency} />
      </ChartCard>

      <ChartCard title={t('reports.incomeByCategory')}>
        <HorizontalBarChart data={incomeByCategory.map((row) => ({ ...row, value: row.total }))} currency={settings.baseCurrency} />
      </ChartCard>

      <ChartCard title={t('reports.expenseByCurrency')}>
        <HorizontalBarChart data={expenseByCurrency.map((row) => ({ ...row, value: row.total }))} currency={currency === 'all' ? settings.baseCurrency : currency} />
      </ChartCard>

      <ChartCard title={t('reports.walletBalances')}>
        <DonutChart data={walletRows.map((row) => ({ ...row, value: Math.abs(row.total) }))} />
      </ChartCard>
      {wallets.map((wallet) => (
        <WalletCard key={wallet.id} wallet={wallet} />
      ))}

      <SectionHeader title={t('reports.loanDebtSummary')} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <ReportCard label={t('dashboard.liability')} value={summary.liabilityMovement} currency={settings.baseCurrency} icon="arrow-up-circle-outline" color={theme.colors.warning} />
        <ReportCard label={t('dashboard.receivable')} value={summary.receivableMovement} currency={settings.baseCurrency} icon="arrow-down-circle-outline" color={theme.colors.success} />
      </View>

      <SectionHeader title={t('reports.interestSummary')} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <ReportCard label={t('types.interest_income')} value={summary.interestIncome} currency={settings.baseCurrency} icon="sparkles-outline" color={theme.colors.success} />
        <ReportCard label={t('types.interest_expense')} value={summary.interestExpense} currency={settings.baseCurrency} icon="time-outline" color={theme.colors.warning} />
      </View>

      <SectionHeader title={t('reports.compensationSummary')} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <ReportCard label={t('types.compensation_received')} value={summary.compensationReceived} currency={settings.baseCurrency} icon="medkit-outline" color={theme.colors.success} />
        <ReportCard label={t('types.compensation_paid')} value={summary.compensationPaid} currency={settings.baseCurrency} icon="shield-outline" color={theme.colors.danger} />
      </View>

      <SectionHeader title={t('reports.taxFeeSummary')} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <ReportCard label={t('types.tax')} value={summary.taxes} currency={settings.baseCurrency} icon="document-text-outline" color={theme.colors.warning} />
        <ReportCard label={t('types.fee')} value={summary.fees} currency={settings.baseCurrency} icon="receipt-outline" color={theme.colors.danger} />
      </View>

      <HistorySection title={t('reports.topIndividualExpenses')} rows={topExpenses} currency={settings.baseCurrency} />
      <HistorySection title={t('reports.exchangeHistory')} rows={exchangeHistory} currency={settings.baseCurrency} />
      <HistorySection title={t('reports.loanDebtHistory')} rows={loanHistory} currency={settings.baseCurrency} />

      <SectionHeader title={t('transaction.activeOnly')} />
      {filtered.length === 0 ? (
        <EmptyState title={t('empty.title')} body={t('empty.reports')} />
      ) : (
        filtered.slice(0, 12).map((transaction) => (
          <TransactionItem
            key={transaction.id}
            transaction={transaction}
            onPress={() => navigation.navigate('TransactionDetail' as never, { transactionId: transaction.id } as never)}
          />
        ))
      )}
    </Screen>
  );
}

function HistorySection({ title, rows, currency }: { title: string; rows: Array<{ id: string; title: string; date: string; amount: number; subtitle: string }>; currency: string }) {
  const { theme } = useAppPreferences();

  return (
    <>
      <SectionHeader title={title} />
      <View style={{ gap: 8 }}>
        {rows.length === 0 ? (
          <Text style={{ color: theme.colors.textMuted }}>{'No data'}</Text>
        ) : (
          rows.map((row) => (
            <View key={row.id} style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '900' }} numberOfLines={1}>{row.title}</Text>
                <Text style={{ color: theme.colors.textMuted, fontSize: 12 }} numberOfLines={1}>{row.subtitle}</Text>
              </View>
              <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '900' }}>
                {formatMoney(row.amount, currency as never)}
              </Text>
            </View>
          ))
        )}
      </View>
    </>
  );
}
