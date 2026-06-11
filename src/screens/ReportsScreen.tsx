import { useNavigation } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { BottomSheet } from '../components/BottomSheet';
import { Card } from '../components/Card';
import {
  ChartCard,
  DonutChart,
  HorizontalBarChart,
  LineTrendChart,
  MonthlyBarChart,
} from '../components/ChartCard';
import { EmptyState } from '../components/EmptyState';
import { DatePickerField } from '../components/DatePickerField';
import { PickerField } from '../components/PickerField';
import { ReportCard } from '../components/ReportCard';
import { Screen } from '../components/Screen';
import { SectionHeader } from '../components/SectionHeader';
import { TransactionItem } from '../components/TransactionItem';
import { WalletCard } from '../components/WalletCard';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useFinance } from '../context/FinanceContext';
import { useI18n } from '../i18n/useI18n';
import { dateRangeForPreset, formatDateRangeLabel, isWithinDateRange, type DateRangePreset } from '../logic/dateRanges';
import { transactionTypes } from '../logic/ledger';
import {
  calculateReportSummary,
  groupExpensesByCurrency,
  groupTransactionsByCategory,
  historyByTypes,
  monthlyIncomeExpense,
  topIndividualExpenses,
  walletDistribution,
} from '../logic/reports';
import type { CurrencyCode, TransactionType } from '../types';
import { formatMoney } from '../utils/money';

type RangeMode = DateRangePreset;

export function ReportsScreen() {
  const navigation = useNavigation<any>();
  const { theme, settings } = useAppPreferences();
  const { wallets, categories, currencies, transactions } = useFinance();
  const { t, locale } = useI18n();
  const [rangeMode, setRangeMode] = useState<RangeMode>('this_month');
  const [customFrom, setCustomFrom] = useState(new Date().toISOString().slice(0, 10));
  const [customTo, setCustomTo] = useState(new Date().toISOString().slice(0, 10));
  const [currency, setCurrency] = useState<'all' | CurrencyCode>('all');
  const [categoryId, setCategoryId] = useState('all');
  const [walletId, setWalletId] = useState('all');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [dateSheetVisible, setDateSheetVisible] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const currencyOptions = currencies.length > 0 ? currencies.filter((item) => item.isActive).map((item) => item.code) : ['USD'];
  const activeFilterCount = [currency !== 'all', categoryId !== 'all', walletId !== 'all', typeFilter !== 'all'].filter(Boolean).length;

  const activeRange = useMemo(
    () =>
      dateRangeForPreset(
        rangeMode,
        new Date(),
        rangeMode === 'custom'
          ? {
              from: customFrom,
              to: customTo,
            }
          : undefined
      ),
    [rangeMode, customFrom, customTo]
  );

  const filtered = useMemo(
    () =>
      transactions.filter((transaction) => {
        if (!isWithinDateRange(transaction.date, activeRange)) return false;
        if (currency !== 'all' && transaction.currency !== currency) return false;
        if (categoryId !== 'all' && transaction.categoryId !== categoryId) return false;
        if (typeFilter !== 'all' && transaction.type !== typeFilter) return false;
        if (walletId !== 'all' && transaction.walletId !== walletId && transaction.toWalletId !== walletId) {
          return false;
        }
        return true;
      }),
    [transactions, activeRange, currency, categoryId, walletId, typeFilter]
  );

  const summary = calculateReportSummary(filtered, settings.baseCurrency);
  const trend = monthlyIncomeExpense(filtered, settings.baseCurrency, 12);
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
  const rangeOptions = [
    { label: t('dateRange.today'), value: 'today' as RangeMode },
    { label: t('dateRange.yesterday'), value: 'yesterday' as RangeMode },
    { label: t('dateRange.thisWeek'), value: 'this_week' as RangeMode },
    { label: t('dateRange.lastWeek'), value: 'last_week' as RangeMode },
    { label: t('dateRange.thisMonth'), value: 'this_month' as RangeMode },
    { label: t('dateRange.lastMonth'), value: 'last_month' as RangeMode },
    { label: t('dateRange.thisQuarter'), value: 'this_quarter' as RangeMode },
    { label: t('dateRange.thisYear'), value: 'this_year' as RangeMode },
    { label: t('reports.customRange'), value: 'custom' as RangeMode },
  ];

  return (
    <Screen>
      <SectionHeader title={t('reports.title')} />

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setDateSheetVisible(true)}
          style={({ pressed }) => ({
            flex: 1,
            minHeight: 62,
            borderRadius: theme.radius.md,
            borderWidth: 1,
            borderColor: theme.colors.border,
            backgroundColor: pressed ? theme.colors.surfaceElevated : theme.colors.surface,
            padding: 12,
            justifyContent: 'center',
          })}
        >
          <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '800' }}>{t('reports.dateRange')}</Text>
          <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '900', marginTop: 2 }} numberOfLines={1}>
            {formatDateRangeLabel(activeRange, locale)}
          </Text>
        </Pressable>
        <AppButton
          title={activeFilterCount > 0 ? `${t('reports.filters')} (${activeFilterCount})` : t('reports.filters')}
          icon="options-outline"
          variant="secondary"
          onPress={() => setFiltersVisible(true)}
          style={{ minWidth: 112 }}
        />
      </View>

      <BottomSheet visible={dateSheetVisible} title={t('reports.dateRange')} onClose={() => setDateSheetVisible(false)}>
        {rangeOptions.map((option) => {
          const selected = option.value === rangeMode;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              onPress={() => {
                setRangeMode(option.value);
                if (option.value !== 'custom') setDateSheetVisible(false);
              }}
            >
              <Card
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  borderColor: selected ? theme.colors.primary : theme.colors.border,
                  backgroundColor: selected ? `${theme.colors.primary}12` : theme.colors.surface,
                }}
              >
                <Text style={{ flex: 1, color: theme.colors.text, fontSize: 15, fontWeight: '900' }}>{option.label}</Text>
                {selected ? <Text style={{ color: theme.colors.primary, fontSize: 13, fontWeight: '900' }}>{t('common.active')}</Text> : null}
              </Card>
            </Pressable>
          );
        })}
        {rangeMode === 'custom' ? (
          <Card style={{ gap: 12 }}>
            <DatePickerField label={t('dateRange.startDate')} value={customFrom} onChangeText={setCustomFrom} />
            <DatePickerField label={t('dateRange.endDate')} value={customTo} onChangeText={setCustomTo} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <AppButton title={t('dateRange.apply')} icon="checkmark-outline" onPress={() => setDateSheetVisible(false)} style={{ flex: 1 }} />
              <AppButton
                title={t('dateRange.clear')}
                icon="close-outline"
                variant="secondary"
                onPress={() => {
                  setRangeMode('this_month');
                  setCustomFrom(new Date().toISOString().slice(0, 10));
                  setCustomTo(new Date().toISOString().slice(0, 10));
                  setDateSheetVisible(false);
                }}
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        ) : null}
      </BottomSheet>

      <BottomSheet
        visible={filtersVisible}
        title={t('reports.filters')}
        onClose={() => setFiltersVisible(false)}
        footer={
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <AppButton
              title={t('reports.resetFilters')}
              icon="refresh-outline"
              variant="secondary"
              onPress={() => {
                setCurrency('all');
                setCategoryId('all');
                setWalletId('all');
                setTypeFilter('all');
              }}
              style={{ flex: 1 }}
            />
            <AppButton title={t('dateRange.apply')} icon="checkmark-outline" onPress={() => setFiltersVisible(false)} style={{ flex: 1 }} />
          </View>
        }
      >
        <PickerField
          label={t('common.currency')}
          value={currency}
          onChange={setCurrency}
          options={[{ label: t('common.all'), value: 'all' }, ...currencyOptions.map((item) => ({ label: item, value: item }))]}
          searchable
        />
        <PickerField
          label={t('common.category')}
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
          searchable
        />
        <PickerField
          label={t('common.wallet')}
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
          searchable
        />
        <PickerField
          label={t('transaction.type')}
          value={typeFilter}
          onChange={setTypeFilter}
          options={[{ label: t('common.all'), value: 'all' }, ...transactionTypes.map((item) => ({ label: t(`types.${item}`), value: item }))]}
          searchable
        />
      </BottomSheet>

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
  const { t } = useI18n();

  return (
    <>
      <SectionHeader title={title} />
      <View style={{ gap: 8 }}>
        {rows.length === 0 ? (
          <Text style={{ color: theme.colors.textMuted }}>{t('reports.noData')}</Text>
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
