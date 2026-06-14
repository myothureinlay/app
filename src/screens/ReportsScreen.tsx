import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';

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
import { getCurrencyBadge } from '../constants/currencies';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useFinance } from '../context/FinanceContext';
import { useI18n } from '../i18n/useI18n';
import { dateRangeForPreset, formatDateRangeLabel, isWithinDateRange, type DateRangePreset } from '../logic/dateRanges';
import { reportColorByType, transactionTypeIcons, transactionTypes } from '../logic/ledger';
import {
  calculateReportSummary,
  groupExpensesByCurrency,
  groupTransactionsByCategory,
  groupTransactionsByParentCategory,
  groupTransactionsBySubcategory,
  historyByTypes,
  monthlyIncomeExpense,
  topIndividualExpenses,
  walletDistribution,
} from '../logic/reports';
import type { CurrencyCode, TransactionType } from '../types';
import { saveAndShareFile } from '../utils/files';
import { formatMoney } from '../utils/money';
import { buildExcelCompatibleReport, buildReportImageSvg, buildReportPdf } from '../utils/reportExports';

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

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function csvCell(value: string | number) {
  const next = String(value);
  return /[",\n]/.test(next) ? `"${next.replace(/"/g, '""')}"` : next;
}

function csvLine(values: Array<string | number>) {
  return values.map(csvCell).join(',');
}

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
  const [parentCategoryId, setParentCategoryId] = useState('all');
  const [subcategoryId, setSubcategoryId] = useState('all');
  const [walletId, setWalletId] = useState('all');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [dateSheetVisible, setDateSheetVisible] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [exportVisible, setExportVisible] = useState(false);
  const [customizeVisible, setCustomizeVisible] = useState(false);
  const currencyOptions = currencies.length > 0 ? currencies.filter((item) => item.isActive).map((item) => item.code) : ['USD'];
  const parentCategories = categories.filter((category) => !category.parentId && !category.removedAt);
  const subcategoryOptions = categories.filter((category) => {
    if (!category.parentId || category.removedAt) return false;
    return parentCategoryId === 'all' || category.parentId === parentCategoryId;
  });
  const activeFilterCount = [
    currency !== 'all',
    categoryId !== 'all',
    parentCategoryId !== 'all',
    subcategoryId !== 'all',
    walletId !== 'all',
    typeFilter !== 'all',
  ].filter(Boolean).length;
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
        if (parentCategoryId !== 'all' && (transaction.parentCategoryId ?? transaction.categoryId) !== parentCategoryId) return false;
        if (subcategoryId !== 'all') {
          if (subcategoryId === 'none' && transaction.subcategoryId) return false;
          if (subcategoryId !== 'none' && transaction.subcategoryId !== subcategoryId) return false;
        }
        if (typeFilter !== 'all' && transaction.type !== typeFilter) return false;
        if (walletId !== 'all' && transaction.walletId !== walletId && transaction.toWalletId !== walletId) {
          return false;
        }
        return true;
      }),
    [transactions, activeRange, currency, categoryId, parentCategoryId, subcategoryId, walletId, typeFilter]
  );

  const summary = calculateReportSummary(filtered, settings.baseCurrency);
  const trend = monthlyIncomeExpense(filtered, settings.baseCurrency, 12);
  const expenseByCategory = groupTransactionsByCategory(filtered, settings.baseCurrency, 'expense');
  const incomeByCategory = groupTransactionsByCategory(filtered, settings.baseCurrency, 'income');
  const expenseByParentCategory = groupTransactionsByParentCategory(filtered, settings.baseCurrency, 'expense');
  const expenseBySubcategory = groupTransactionsBySubcategory(filtered, settings.baseCurrency, 'expense');
  const incomeByParentCategory = groupTransactionsByParentCategory(filtered, settings.baseCurrency, 'income');
  const incomeBySubcategory = groupTransactionsBySubcategory(filtered, settings.baseCurrency, 'income');
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
  const quickRangeOptions = rangeOptions.slice(0, 6);
  const rangeLabel = formatDateRangeLabel(activeRange, locale);
  const activeRangeName = rangeOptions.find((option) => option.value === rangeMode)?.label ?? rangeLabel;
  const categoryLabel = categoryId === 'all' ? t('common.all') : categories.find((category) => category.id === categoryId)?.name ?? t('common.all');
  const parentCategoryLabel = parentCategoryId === 'all' ? t('common.all') : categories.find((category) => category.id === parentCategoryId)?.name ?? t('common.all');
  const subcategoryLabel =
    subcategoryId === 'all'
      ? t('common.all')
      : subcategoryId === 'none'
        ? t('category.noSubcategory')
        : categories.find((category) => category.id === subcategoryId)?.name ?? t('common.all');
  const walletLabel = walletId === 'all' ? t('common.all') : wallets.find((wallet) => wallet.id === walletId)?.name ?? t('common.all');
  const typeLabel = typeFilter === 'all' ? t('common.all') : t(`types.${typeFilter}`);
  const filterSummary = [
    `${t('common.currency')}: ${currency === 'all' ? t('common.all') : currency}`,
    `${t('category.parentCategory')}: ${parentCategoryLabel}`,
    `${t('category.subcategory')}: ${subcategoryLabel}`,
    `${t('common.category')}: ${categoryLabel}`,
    `${t('common.wallet')}: ${walletLabel}`,
    `${t('transaction.type')}: ${typeLabel}`,
  ].join(' | ');
  const reportCsv = useMemo(() => {
    const rows = [
      csvLine([t('about.appName'), t('settings.exportReportTitle')]),
      csvLine([t('reports.dateRange'), rangeLabel]),
      csvLine([t('reports.activePreset'), activeRangeName]),
      csvLine([t('reports.generatedAt'), new Date().toLocaleString()]),
      csvLine([t('reports.activeFilters'), filterSummary]),
      csvLine([t('widgets.visible'), activeReportWidgets.map((widget) => widget.title).join(' / ')]),
      '',
      csvLine([t('reports.summaryValues')]),
      csvLine([t('common.income'), formatMoney(summary.income, settings.baseCurrency)]),
      csvLine([t('common.expense'), formatMoney(summary.expenses, settings.baseCurrency)]),
      csvLine([t('reports.lossSummary'), formatMoney(summary.losses, settings.baseCurrency)]),
      csvLine([t('dashboard.netCashflow'), formatMoney(summary.netCashflow, settings.baseCurrency)]),
      csvLine([t('dashboard.receivable'), formatMoney(summary.receivableMovement, settings.baseCurrency)]),
      csvLine([t('dashboard.liability'), formatMoney(summary.liabilityMovement, settings.baseCurrency)]),
      '',
      csvLine([t('reports.monthlyCashflowTrend')]),
      csvLine([t('common.month'), t('common.income'), t('common.expense'), t('dashboard.netCashflow')]),
      ...trend.map((row) => csvLine([row.label, row.income, row.expenses, row.cashflow])),
      '',
      csvLine([t('reports.expenseByCategory')]),
      csvLine([t('common.category'), t('common.total')]),
      ...expenseByCategory.map((row) => csvLine([row.label, row.total])),
      '',
      csvLine([t('reports.expenseByParentCategory')]),
      csvLine([t('category.parentCategory'), t('common.total')]),
      ...expenseByParentCategory.map((row) => csvLine([row.label, row.total])),
      '',
      csvLine([t('reports.expenseBySubcategory')]),
      csvLine([t('category.subcategory'), t('common.total')]),
      ...expenseBySubcategory.map((row) => csvLine([row.label, row.total])),
      '',
      csvLine([t('reports.incomeByParentCategory')]),
      csvLine([t('category.parentCategory'), t('common.total')]),
      ...incomeByParentCategory.map((row) => csvLine([row.label, row.total])),
      '',
      csvLine([t('reports.incomeBySubcategory')]),
      csvLine([t('category.subcategory'), t('common.total')]),
      ...incomeBySubcategory.map((row) => csvLine([row.label, row.total])),
      '',
      csvLine([t('reports.topIndividualExpenses')]),
      csvLine([t('common.date'), t('transaction.title'), t('common.amount')]),
      ...topExpenses.map((row) => csvLine([row.date, row.title, row.amount])),
    ];
    return rows.join('\n');
  }, [
    activeRangeName,
    activeReportWidgets,
    expenseByCategory,
    expenseByParentCategory,
    expenseBySubcategory,
    incomeByParentCategory,
    incomeBySubcategory,
    filterSummary,
    rangeLabel,
    settings.baseCurrency,
    summary,
    t,
    topExpenses,
    trend,
  ]);

  const reportExportInput = () => ({
    reportCsv,
    reportTitle: t('settings.exportReportTitle'),
    dateRangeLabel: rangeLabel,
    generatedAt: new Date().toLocaleString(),
    logoUri: Image.resolveAssetSource(require('../../assets/icon.png')).uri,
  });

  const exportReport = async (format: 'csv' | 'excel' | 'pdf' | 'image') => {
    try {
      if (format === 'csv') {
        const uri = await saveAndShareFile(`finance-report-${stamp()}.csv`, reportCsv, 'text/csv');
        Alert.alert(t('settings.exported'), uri);
        setExportVisible(false);
        return;
      }

      if (format === 'excel') {
        const uri = await saveAndShareFile(
          `finance-report-${stamp()}.xls`,
          buildExcelCompatibleReport(reportExportInput()),
          'application/vnd.ms-excel'
        );
        Alert.alert(t('settings.exported'), `${uri}\n${t('settings.excelCompatibleNote')}`);
        setExportVisible(false);
        return;
      }

      if (format === 'pdf') {
        const uri = await saveAndShareFile(`finance-report-${stamp()}.pdf`, buildReportPdf(reportExportInput()), 'application/pdf');
        Alert.alert(t('settings.exported'), uri);
        setExportVisible(false);
        return;
      }

      const uri = await saveAndShareFile(
        `finance-report-image-${stamp()}.svg`,
        buildReportImageSvg(reportExportInput()),
        'image/svg+xml'
      );
      Alert.alert(t('settings.exported'), `${uri}\n${t('settings.imageExportNote')}`);
      setExportVisible(false);
    } catch {
      Alert.alert(t('settings.exportFailed'));
    }
  };

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
                  onAction={() => navigation.navigate('AddTransaction' as never)}
                />
              ) : (
                <DonutChart data={expenseByCategory.map((row) => ({ ...row, value: row.total }))} />
              )}
            </ChartCard>
            <ChartCard title={t('reports.expenseByParentCategory')}>
              <HorizontalBarChart data={expenseByParentCategory.map((row) => ({ ...row, value: row.total }))} currency={settings.baseCurrency} />
            </ChartCard>
            <ChartCard title={t('reports.expenseBySubcategory')}>
              <HorizontalBarChart data={expenseBySubcategory.map((row) => ({ ...row, value: row.total }))} currency={settings.baseCurrency} />
            </ChartCard>
            <ChartCard title={t('reports.topExpenseCategories')}>
              <HorizontalBarChart data={expenseByCategory.map((row) => ({ ...row, value: row.total }))} currency={settings.baseCurrency} />
            </ChartCard>
            <ChartCard title={t('reports.incomeByCategory')}>
              <HorizontalBarChart data={incomeByCategory.map((row) => ({ ...row, value: row.total }))} currency={settings.baseCurrency} />
            </ChartCard>
            <ChartCard title={t('reports.incomeByParentCategory')}>
              <HorizontalBarChart data={incomeByParentCategory.map((row) => ({ ...row, value: row.total }))} currency={settings.baseCurrency} />
            </ChartCard>
            <ChartCard title={t('reports.incomeBySubcategory')}>
              <HorizontalBarChart data={incomeBySubcategory.map((row) => ({ ...row, value: row.total }))} currency={settings.baseCurrency} />
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
                onAction={() => navigation.navigate('AddTransaction' as never)}
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
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <AppButton
              title={t('common.export')}
              icon="download-outline"
              onPress={() => setExportVisible(true)}
              style={{ minHeight: 42, paddingHorizontal: 12 }}
            />
            <AppButton
              title=""
              icon="options-outline"
              variant="secondary"
              onPress={() => setCustomizeVisible(true)}
              style={{ width: 44, minHeight: 44, borderRadius: 22, paddingHorizontal: 0 }}
            />
          </View>
        }
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 16 }}>
        {quickRangeOptions.map((option) => {
          const selected = option.value === rangeMode;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              onPress={() => setRangeMode(option.value)}
              style={({ pressed }) => ({
                minHeight: 38,
                paddingHorizontal: 13,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: selected ? theme.colors.primary : theme.colors.border,
                backgroundColor: selected ? theme.colors.primary : pressed ? theme.colors.surfaceElevated : theme.colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
              })}
            >
              <Text style={{ color: selected ? '#FFFFFF' : theme.colors.text, fontSize: 13, fontWeight: '900' }}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

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

      <BottomSheet
        visible={dateSheetVisible}
        title={t('reports.dateRange')}
        onClose={() => setDateSheetVisible(false)}
        footer={
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
        }
      >
        {rangeOptions.map((option) => {
          const selected = option.value === rangeMode;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              onPress={() => setRangeMode(option.value)}
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
          </Card>
        ) : null}
      </BottomSheet>

      <BottomSheet visible={exportVisible} title={t('reports.exportReport')} onClose={() => setExportVisible(false)}>
        <Card style={{ gap: 6, backgroundColor: `${theme.colors.primary}10`, borderColor: `${theme.colors.primary}35` }}>
          <Text style={{ color: theme.colors.primary, fontSize: 13, fontWeight: '900' }}>{rangeLabel}</Text>
          <Text style={{ color: theme.colors.textMuted, fontSize: 12, lineHeight: 17 }}>{filterSummary}</Text>
        </Card>
        <AppButton title={t('reports.exportCsv')} icon="document-text-outline" variant="secondary" onPress={() => exportReport('csv')} />
        <AppButton title={t('reports.exportExcel')} icon="grid-outline" variant="secondary" onPress={() => exportReport('excel')} />
        <AppButton title={t('reports.exportPdf')} icon="document-outline" variant="secondary" onPress={() => exportReport('pdf')} />
        <AppButton title={t('reports.exportImage')} icon="image-outline" variant="secondary" onPress={() => exportReport('image')} />
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
                setParentCategoryId('all');
                setSubcategoryId('all');
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
          options={[{ label: t('common.all'), value: 'all', icon: 'layers-outline' }, ...currencyOptions.map((item) => ({ label: item, value: item, icon: 'cash-outline', badge: getCurrencyBadge(item) }))]}
          icon="cash-outline"
          searchable
        />
        <PickerField
          label={t('category.parentCategory')}
          value={parentCategoryId}
          onChange={(value) => {
            setParentCategoryId(value);
            setSubcategoryId('all');
          }}
          options={[
            { label: t('common.all'), value: 'all', icon: 'pricetags-outline' },
            ...parentCategories.map((category) => ({
              label: category.name,
              value: category.id,
              icon: category.icon,
              color: category.color,
            })),
          ]}
          icon="pricetags-outline"
          searchable
        />
        <PickerField
          label={t('category.subcategory')}
          value={subcategoryId}
          onChange={setSubcategoryId}
          options={[
            { label: t('common.all'), value: 'all', icon: 'layers-outline' },
            { label: t('category.noSubcategory'), value: 'none', icon: 'remove-circle-outline' },
            ...subcategoryOptions.map((category) => ({
              label: category.name,
              value: category.id,
              icon: category.icon,
              color: category.color,
              detail: categories.find((parent) => parent.id === category.parentId)?.name,
            })),
          ]}
          icon="pricetag-outline"
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
