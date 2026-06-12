import { Ionicons } from '@expo/vector-icons';
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
import { WidgetCustomizeSheet, visibleWidgets, type WidgetDescriptor } from '../components/WidgetCustomizeSheet';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useFinance } from '../context/FinanceContext';
import { useI18n } from '../i18n/useI18n';
import { dateRangeForPreset, formatDateRangeLabel, isWithinDateRange, type DateRangePreset } from '../logic/dateRanges';
import { reportColorByType, transactionTypeIcons, transactionTypes } from '../logic/ledger';
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

const reportWidgetIds = [
  'monthlySummary',
  'incomeVsExpense',
  'cashflowTrend',
  'categoryBreakdown',
  'walletDistribution',
  'lossSummary',
  'loanDebt',
  'interest',
  'compensation',
  'taxFees',
  'history',
  'transactions',
] as const;

type ReportWidgetId = (typeof reportWidgetIds)[number];

export function ReportsScreen() {
  const navigation = useNavigation<any>();
  const { theme, settings, updateSettings } = useAppPreferences();
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
  const [customizeVisible, setCustomizeVisible] = useState(false);
  const currencyOptions = currencies.length > 0 ? currencies.filter((item) => item.isActive).map((item) => item.code) : ['USD'];
  const activeFilterCount = [currency !== 'all', categoryId !== 'all', walletId !== 'all', typeFilter !== 'all'].filter(Boolean).length;
  const reportWidgets = useMemo<WidgetDescriptor[]>(
    () => [
      { id: 'monthlySummary', title: t('reports.monthlySummary'), icon: 'calendar-outline', color: theme.colors.primary },
      { id: 'incomeVsExpense', title: t('reports.incomeVsExpense'), icon: 'bar-chart-outline', color: theme.colors.success },
      { id: 'cashflowTrend', title: t('reports.monthlyCashflowTrend'), icon: 'analytics-outline', color: theme.colors.accent },
      { id: 'categoryBreakdown', title: t('reports.expenseByCategory'), icon: 'pie-chart-outline', color: theme.colors.danger },
      { id: 'walletDistribution', title: t('reports.walletBalances'), icon: 'wallet-outline', color: theme.colors.success },
      { id: 'lossSummary', title: t('reports.lossSummary'), icon: 'alert-circle-outline', color: theme.colors.danger },
      { id: 'loanDebt', title: t('reports.loanDebtSummary'), icon: 'swap-vertical-outline', color: theme.colors.warning },
      { id: 'interest', title: t('reports.interestSummary'), icon: 'sparkles-outline', color: theme.colors.success },
      { id: 'compensation', title: t('reports.compensationSummary'), icon: 'medkit-outline', color: theme.colors.accent },
      { id: 'taxFees', title: t('reports.taxFeeSummary'), icon: 'receipt-outline', color: theme.colors.warning },
      { id: 'history', title: t('reports.historyTables'), icon: 'list-outline', color: theme.colors.primary },
      { id: 'transactions', title: t('transaction.activeOnly'), icon: 'receipt-outline', color: theme.colors.primary },
    ],
    [t, theme]
  );
  const activeReportWidgets = visibleWidgets(reportWidgets, settings.reportWidgets);

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

  const renderReportWidget = (id: ReportWidgetId) => {
    switch (id) {
      case 'monthlySummary':
        return (
          <>
            <SectionHeader title={t('reports.monthlySummary')} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <ReportCard label={t('common.income')} value={summary.income} currency={settings.baseCurrency} icon="trending-up-outline" color={theme.colors.success} />
              <ReportCard label={t('common.expense')} value={summary.expenses} currency={settings.baseCurrency} icon="trending-down-outline" color={theme.colors.danger} />
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <ReportCard label={t('reports.lossSummary')} value={summary.losses} currency={settings.baseCurrency} icon="alert-circle-outline" color={theme.colors.danger} />
              <ReportCard label={t('dashboard.netCashflow')} value={summary.netCashflow} currency={settings.baseCurrency} icon="pulse-outline" color={summary.netCashflow >= 0 ? theme.colors.success : theme.colors.danger} />
            </View>
          </>
        );
      case 'incomeVsExpense':
        return (
          <ChartCard title={t('reports.incomeVsExpense')}>
            <MonthlyBarChart data={trend} />
          </ChartCard>
        );
      case 'cashflowTrend':
        return (
          <ChartCard title={t('reports.monthlyCashflowTrend')}>
            <LineTrendChart data={trend} />
          </ChartCard>
        );
      case 'categoryBreakdown':
        return (
          <>
            <ChartCard title={t('reports.expenseByCategory')}>
              {expenseByCategory.length === 0 ? (
                <EmptyState
                  title={t('empty.title')}
                  body={t('empty.reports')}
                  icon="pie-chart-outline"
                  actionLabel={t('empty.addFirstTransaction')}
                  actionIcon="add-circle-outline"
                  onAction={() => navigation.navigate('Add' as never)}
                />
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
          </>
        );
      case 'walletDistribution':
        return (
          <>
            <ChartCard title={t('reports.walletBalances')}>
              {wallets.length === 0 ? (
                <EmptyState
                  title={t('empty.title')}
                  body={t('empty.wallets')}
                  icon="wallet-outline"
                  actionLabel={t('manage.addWallet')}
                  actionIcon="add-circle-outline"
                  onAction={() => navigation.navigate('ManageWallets' as never)}
                />
              ) : (
                <DonutChart data={walletRows.map((row) => ({ ...row, value: Math.abs(row.total) }))} />
              )}
            </ChartCard>
            {wallets.map((wallet) => (
              <WalletCard key={wallet.id} wallet={wallet} />
            ))}
          </>
        );
      case 'lossSummary':
        return (
          <>
            <SectionHeader title={t('reports.lossSummary')} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <ReportCard label={t('types.loss')} value={summary.losses} currency={settings.baseCurrency} icon="alert-circle-outline" color={theme.colors.danger} />
            </View>
          </>
        );
      case 'loanDebt':
        return (
          <>
            <SectionHeader title={t('reports.loanDebtSummary')} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <ReportCard label={t('dashboard.liability')} value={summary.liabilityMovement} currency={settings.baseCurrency} icon="arrow-up-circle-outline" color={theme.colors.warning} />
              <ReportCard label={t('dashboard.receivable')} value={summary.receivableMovement} currency={settings.baseCurrency} icon="arrow-down-circle-outline" color={theme.colors.success} />
            </View>
          </>
        );
      case 'interest':
        return (
          <>
            <SectionHeader title={t('reports.interestSummary')} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <ReportCard label={t('types.interest_income')} value={summary.interestIncome} currency={settings.baseCurrency} icon="sparkles-outline" color={theme.colors.success} />
              <ReportCard label={t('types.interest_expense')} value={summary.interestExpense} currency={settings.baseCurrency} icon="time-outline" color={theme.colors.warning} />
            </View>
          </>
        );
      case 'compensation':
        return (
          <>
            <SectionHeader title={t('reports.compensationSummary')} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <ReportCard label={t('types.compensation_received')} value={summary.compensationReceived} currency={settings.baseCurrency} icon="medkit-outline" color={theme.colors.success} />
              <ReportCard label={t('types.compensation_paid')} value={summary.compensationPaid} currency={settings.baseCurrency} icon="shield-outline" color={theme.colors.danger} />
            </View>
          </>
        );
      case 'taxFees':
        return (
          <>
            <SectionHeader title={t('reports.taxFeeSummary')} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <ReportCard label={t('types.tax')} value={summary.taxes} currency={settings.baseCurrency} icon="document-text-outline" color={theme.colors.warning} />
              <ReportCard label={t('types.fee')} value={summary.fees} currency={settings.baseCurrency} icon="receipt-outline" color={theme.colors.danger} />
            </View>
          </>
        );
      case 'history':
        return (
          <>
            <HistorySection title={t('reports.topIndividualExpenses')} rows={topExpenses} currency={settings.baseCurrency} />
            <HistorySection title={t('reports.exchangeHistory')} rows={exchangeHistory} currency={settings.baseCurrency} />
            <HistorySection title={t('reports.loanDebtHistory')} rows={loanHistory} currency={settings.baseCurrency} />
          </>
        );
      case 'transactions':
        return (
          <>
            <SectionHeader title={t('transaction.activeOnly')} />
            {filtered.length === 0 ? (
              <EmptyState
                title={t('empty.title')}
                body={t('empty.reports')}
                icon="receipt-outline"
                actionLabel={t('empty.addFirstTransaction')}
                actionIcon="add-circle-outline"
                onAction={() => navigation.navigate('Add' as never)}
              />
            ) : (
              filtered.slice(0, 12).map((transaction) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                  onPress={() => navigation.navigate('TransactionDetail' as never, { transactionId: transaction.id } as never)}
                />
              ))
            )}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Screen>
      <SectionHeader
        title={t('reports.title')}
        action={
          <AppButton
            title={t('widgets.customize')}
            icon="options-outline"
            variant="secondary"
            onPress={() => setCustomizeVisible(true)}
            style={{ minHeight: 42 }}
          />
        }
      />

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setDateSheetVisible(true)}
          style={({ pressed }) => ({
            flex: 1,
            minHeight: 56,
            borderRadius: theme.radius.md,
            borderWidth: 1,
            borderColor: theme.colors.border,
            backgroundColor: pressed ? theme.colors.surfaceElevated : theme.colors.surface,
            paddingHorizontal: 12,
            paddingVertical: 9,
            justifyContent: 'center',
          })}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="calendar-outline" size={17} color={theme.colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.colors.textMuted, fontSize: 11, fontWeight: '800' }}>{t('reports.dateRange')}</Text>
              <Text style={{ color: theme.colors.text, fontSize: 15, fontWeight: '900', marginTop: 1 }} numberOfLines={1}>
                {formatDateRangeLabel(activeRange, locale)}
              </Text>
            </View>
          </View>
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
                  gap: 10,
                  padding: 10,
                  borderColor: selected ? theme.colors.primary : theme.colors.border,
                  backgroundColor: selected ? `${theme.colors.primary}12` : theme.colors.surface,
                }}
              >
                <Ionicons name={option.value === 'custom' ? 'calendar-number-outline' : 'calendar-outline'} size={18} color={selected ? theme.colors.primary : theme.colors.textMuted} />
                <Text style={{ flex: 1, color: theme.colors.text, fontSize: 15, fontWeight: '900' }}>{option.label}</Text>
                {selected ? <Ionicons name="checkmark-circle-outline" size={21} color={theme.colors.primary} /> : null}
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
          options={[{ label: t('common.all'), value: 'all', icon: 'layers-outline' }, ...currencyOptions.map((item) => ({ label: item, value: item, icon: 'cash-outline' }))]}
          icon="cash-outline"
          searchable
        />
        <PickerField
          label={t('common.category')}
          value={categoryId}
          onChange={setCategoryId}
          options={[
            { label: t('common.all'), value: 'all', icon: 'pricetags-outline' },
            ...categories.map((category) => ({
              label: category.name,
              value: category.id,
              icon: category.icon,
              color: category.color,
            })),
          ]}
          icon="pricetag-outline"
          searchable
        />
        <PickerField
          label={t('common.wallet')}
          value={walletId}
          onChange={setWalletId}
          options={[
            { label: t('common.all'), value: 'all', icon: 'wallet-outline' },
            ...wallets.map((wallet) => ({
              label: wallet.name,
              value: wallet.id,
              icon: wallet.icon,
              color: wallet.color,
            })),
          ]}
          icon="wallet-outline"
          searchable
        />
        <PickerField
          label={t('transaction.type')}
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { label: t('common.all'), value: 'all', icon: 'layers-outline' },
            ...transactionTypes.map((item) => ({
              label: t(`types.${item}`),
              value: item,
              icon: transactionTypeIcons[item],
              color: reportColorByType[item],
            })),
          ]}
          icon="swap-horizontal-outline"
          searchable
        />
      </BottomSheet>

      {activeReportWidgets.length === 0 ? (
        <EmptyState
          title={t('widgets.allHiddenTitle')}
          body={t('widgets.allHiddenBody')}
          icon="options-outline"
          actionLabel={t('widgets.customizeReports')}
          actionIcon="options-outline"
          onAction={() => setCustomizeVisible(true)}
        />
      ) : (
        activeReportWidgets.map((widget) => <View key={widget.id}>{renderReportWidget(widget.id as ReportWidgetId)}</View>)
      )}

      <WidgetCustomizeSheet
        visible={customizeVisible}
        title={t('widgets.customizeReports')}
        widgets={reportWidgets}
        preferences={settings.reportWidgets}
        onChange={(reportWidgets) => updateSettings({ reportWidgets })}
        onClose={() => setCustomizeVisible(false)}
      />
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
