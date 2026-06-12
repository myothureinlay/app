import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { ChartCard, LineTrendChart } from '../components/ChartCard';
import { EmptyState } from '../components/EmptyState';
import { PickerField } from '../components/PickerField';
import { Screen } from '../components/Screen';
import { SectionHeader } from '../components/SectionHeader';
import { TransactionItem } from '../components/TransactionItem';
import { WalletCard } from '../components/WalletCard';
import { WidgetCustomizeSheet, visibleWidgets, type WidgetDescriptor } from '../components/WidgetCustomizeSheet';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useFinance } from '../context/FinanceContext';
import { useI18n } from '../i18n/useI18n';
import { calculateReportSummary, monthlyIncomeExpense, totalWalletValue } from '../logic/reports';
import type { CurrencyFilter, TransactionWithMeta } from '../types';
import { endOfMonth, startOfMonth } from '../utils/dates';
import { formatMoney } from '../utils/money';

const dashboardWidgetIds = [
  'balanceSummary',
  'monthlyIncome',
  'monthlyExpenses',
  'netCashflow',
  'monthlyCashflowChart',
  'budgets',
  'goals',
  'walletBalances',
  'loanDebt',
  'recentTransactions',
] as const;

type DashboardWidgetId = (typeof dashboardWidgetIds)[number];

function isThisMonth(transaction: TransactionWithMeta) {
  const date = new Date(transaction.date);
  return date >= startOfMonth() && date <= endOfMonth();
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  const { theme } = useAppPreferences();
  const width = `${Math.max(4, Math.min(100, value))}%` as `${number}%`;

  return (
    <View style={{ height: 8, borderRadius: 4, backgroundColor: theme.colors.surfaceElevated, overflow: 'hidden' }}>
      <View style={{ width, height: '100%', borderRadius: 4, backgroundColor: color }} />
    </View>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, gap: 3 }}>
      <Text style={{ color: '#FFFFFFB8', fontSize: 11, fontWeight: '800' }}>{label}</Text>
      <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '900' }} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

function QuickAction({ icon, label, color, onPress }: { icon: string; label: string; color: string; onPress: () => void }) {
  const { theme } = useAppPreferences();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 58,
        borderRadius: 10,
        backgroundColor: pressed ? theme.colors.surfaceElevated : theme.colors.surface,
        borderColor: theme.colors.border,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
      })}
    >
      <Ionicons name={icon as never} size={20} color={color} />
      <Text style={{ color: theme.colors.text, fontSize: 12, fontWeight: '900' }} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function SummaryTile({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: string;
  color: string;
}) {
  const { theme } = useAppPreferences();

  return (
    <Card style={{ flex: 1, gap: 10, padding: 12, minHeight: 104 }}>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 9,
          backgroundColor: `${color}18`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon as never} size={17} color={color} />
      </View>
      <View style={{ gap: 3 }}>
        <Text style={{ color: theme.colors.textMuted, fontSize: 11, fontWeight: '800' }}>{label}</Text>
        <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '900' }} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
      </View>
    </Card>
  );
}

export function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { theme, settings, updateSettings } = useAppPreferences();
  const { isReady, wallets, currencies, budgets, goals, transactions } = useFinance();
  const { t } = useI18n();
  const [customizeVisible, setCustomizeVisible] = useState(false);

  const monthlyTransactions = transactions.filter(isThisMonth);
  const filteredTransactions = monthlyTransactions.filter((transaction) =>
    settings.dashboardCurrencyFilter === 'all' ? true : transaction.currency === settings.dashboardCurrencyFilter
  );
  const summary = calculateReportSummary(monthlyTransactions, settings.baseCurrency);
  const recent = filteredTransactions.slice(0, 6);
  const trend = monthlyIncomeExpense(transactions, settings.baseCurrency, 6);
  const netWorth = totalWalletValue(wallets, settings.baseCurrency) + summary.receivableMovement - summary.liabilityMovement;
  const activeBudgetCount = budgets.length;
  const overBudgetCount = budgets.filter((budget) => budget.isOverBudget).length;
  const budgetProgress =
    activeBudgetCount === 0
      ? 0
      : budgets.reduce((sum, budget) => sum + Math.min(100, budget.progress), 0) / activeBudgetCount;
  const goalProgress = goals.length === 0 ? 0 : goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length;
  const filterOptions = [
    { label: t('common.all'), value: 'all' as CurrencyFilter, icon: 'layers-outline', color: theme.colors.primary },
    ...currencies
      .filter((currency) => currency.isActive)
      .map((currency) => ({ label: currency.code, value: currency.code as CurrencyFilter, icon: 'cash-outline', color: theme.colors.success })),
  ];
  const dashboardWidgets = useMemo<WidgetDescriptor[]>(
    () => [
      { id: 'balanceSummary', title: t('widgets.dashboard.balanceSummary'), icon: 'wallet-outline', color: theme.colors.primary },
      { id: 'monthlyIncome', title: t('dashboard.monthlyIncome'), icon: 'trending-up-outline', color: theme.colors.success },
      { id: 'monthlyExpenses', title: t('dashboard.monthlyExpenses'), icon: 'trending-down-outline', color: theme.colors.danger },
      { id: 'netCashflow', title: t('dashboard.netCashflow'), icon: 'pulse-outline', color: theme.colors.accent },
      { id: 'monthlyCashflowChart', title: t('dashboard.cashflowTrend'), icon: 'analytics-outline', color: theme.colors.primary },
      { id: 'budgets', title: t('dashboard.budgets'), icon: 'speedometer-outline', color: theme.colors.warning },
      { id: 'goals', title: t('dashboard.goals'), icon: 'flag-outline', color: theme.colors.accent },
      { id: 'walletBalances', title: t('dashboard.walletBalances'), icon: 'card-outline', color: theme.colors.success },
      { id: 'loanDebt', title: t('dashboard.loanSnapshot'), icon: 'swap-vertical-outline', color: theme.colors.warning },
      { id: 'recentTransactions', title: t('dashboard.recentTransactions'), icon: 'receipt-outline', color: theme.colors.primary },
    ],
    [t, theme]
  );
  const activeDashboardWidgets = visibleWidgets(dashboardWidgets, settings.dashboardWidgets);

  if (!isReady) {
    return (
      <Screen scroll={false} contentStyle={{ alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={theme.colors.primary} />
      </Screen>
    );
  }

  const renderDashboardWidget = (id: DashboardWidgetId) => {
    switch (id) {
      case 'balanceSummary':
        return (
          <LinearGradient
            colors={[theme.colors.primaryDark, theme.colors.primary, theme.colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 18, padding: 18, gap: 16 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
              <View style={{ flex: 1, gap: 5 }}>
                <Text style={{ color: '#FFFFFFC8', fontSize: 13, fontWeight: '800' }}>{t('dashboard.greeting')}</Text>
                <Text style={{ color: '#FFFFFF', fontSize: 25, fontWeight: '900' }}>{t('dashboard.title')}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => navigation.navigate('Notifications' as never)}
                style={({ pressed }) => ({
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  backgroundColor: pressed ? '#FFFFFF30' : '#FFFFFF20',
                  alignItems: 'center',
                  justifyContent: 'center',
                })}
              >
                <Ionicons name="notifications-outline" size={21} color="#FFFFFF" />
              </Pressable>
            </View>

            <View style={{ gap: 5 }}>
              <Text style={{ color: '#FFFFFFB8', fontSize: 12, fontWeight: '800' }}>{t('dashboard.netWorth')}</Text>
              <Text style={{ color: '#FFFFFF', fontSize: 33, fontWeight: '900' }} numberOfLines={1} adjustsFontSizeToFit>
                {formatMoney(netWorth, settings.baseCurrency)}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <HeroMetric label={t('dashboard.monthlyIncome')} value={formatMoney(summary.income, settings.baseCurrency)} />
              <HeroMetric label={t('dashboard.monthlyExpenses')} value={formatMoney(summary.expenses + summary.losses, settings.baseCurrency)} />
              <HeroMetric label={t('dashboard.netCashflow')} value={formatMoney(summary.netCashflow, settings.baseCurrency)} />
            </View>
          </LinearGradient>
        );
      case 'monthlyIncome':
        return (
          <SummaryTile
            label={t('dashboard.monthlyIncome')}
            value={formatMoney(summary.income, settings.baseCurrency)}
            icon="trending-up-outline"
            color={theme.colors.success}
          />
        );
      case 'monthlyExpenses':
        return (
          <SummaryTile
            label={t('dashboard.monthlyExpenses')}
            value={formatMoney(summary.expenses + summary.losses, settings.baseCurrency)}
            icon="trending-down-outline"
            color={theme.colors.danger}
          />
        );
      case 'netCashflow':
        return (
          <Card style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '900' }}>{t('dashboard.monthlyPulse')}</Text>
                <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 2 }}>{t('dashboard.monthlyPulseBody')}</Text>
              </View>
              <Text style={{ color: summary.netCashflow >= 0 ? theme.colors.success : theme.colors.danger, fontSize: 15, fontWeight: '900' }}>
                {formatMoney(summary.netCashflow, settings.baseCurrency)}
              </Text>
            </View>
            <ProgressBar value={summary.income <= 0 ? 0 : Math.max(0, (summary.netCashflow / summary.income) * 100)} color={summary.netCashflow >= 0 ? theme.colors.success : theme.colors.danger} />
          </Card>
        );
      case 'monthlyCashflowChart':
        return (
          <ChartCard title={t('dashboard.cashflowTrend')}>
            <LineTrendChart data={trend} />
          </ChartCard>
        );
      case 'budgets':
        return (
          <>
            <SectionHeader
              title={t('dashboard.budgets')}
              action={<AppButton title="" icon="add-outline" onPress={() => navigation.navigate('Budgets' as never)} style={{ width: 42, paddingHorizontal: 0 }} />}
            />
            {budgets.length === 0 ? (
              <EmptyState
                title={t('empty.title')}
                body={t('budget.empty')}
                icon="speedometer-outline"
                actionLabel={t('budget.add')}
                actionIcon="add-circle-outline"
                onAction={() => navigation.navigate('Budgets' as never)}
              />
            ) : (
              <Card style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                  <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '900' }}>{t('dashboard.budgets')}</Text>
                  <Text style={{ color: overBudgetCount > 0 ? theme.colors.danger : theme.colors.textMuted, fontSize: 13, fontWeight: '900' }}>
                    {overBudgetCount} {t('budget.over')}
                  </Text>
                </View>
                <ProgressBar value={budgetProgress} color={overBudgetCount > 0 ? theme.colors.danger : theme.colors.primary} />
              </Card>
            )}
          </>
        );
      case 'goals':
        return (
          <>
            <SectionHeader
              title={t('dashboard.goals')}
              action={<AppButton title="" icon="add-outline" onPress={() => navigation.navigate('Goals' as never)} style={{ width: 42, paddingHorizontal: 0 }} />}
            />
            {goals.length === 0 ? (
              <EmptyState
                title={t('empty.title')}
                body={t('goal.empty')}
                icon="flag-outline"
                actionLabel={t('goal.add')}
                actionIcon="flag-outline"
                onAction={() => navigation.navigate('Goals' as never)}
              />
            ) : (
              <Card style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                  <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '900' }}>{t('dashboard.goals')}</Text>
                  <Text style={{ color: theme.colors.textMuted, fontSize: 13, fontWeight: '900' }}>{Math.round(goalProgress)}%</Text>
                </View>
                <ProgressBar value={goalProgress} color={theme.colors.accent} />
              </Card>
            )}
          </>
        );
      case 'walletBalances':
        return (
          <>
            <SectionHeader
              title={t('dashboard.walletBalances')}
              action={<AppButton title="" icon="add-outline" onPress={() => navigation.navigate('ManageWallets' as never)} style={{ width: 42, paddingHorizontal: 0 }} />}
            />
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
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 20 }}>
                {wallets.slice(0, 6).map((wallet) => (
                  <View key={wallet.id} style={{ width: 270 }}>
                    <WalletCard wallet={wallet} />
                  </View>
                ))}
              </ScrollView>
            )}
          </>
        );
      case 'loanDebt':
        return (
          <>
            <SectionHeader title={t('dashboard.loanSnapshot')} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <SummaryTile
                label={t('dashboard.receivable')}
                value={formatMoney(summary.receivableMovement, settings.baseCurrency)}
                icon="arrow-down-circle-outline"
                color={theme.colors.success}
              />
              <SummaryTile
                label={t('dashboard.liability')}
                value={formatMoney(summary.liabilityMovement, settings.baseCurrency)}
                icon="arrow-up-circle-outline"
                color={theme.colors.warning}
              />
            </View>
          </>
        );
      case 'recentTransactions':
        return (
          <>
            <SectionHeader
              title={t('dashboard.recentTransactions')}
              action={<AppButton title="" icon="add-outline" onPress={() => navigation.navigate('Add' as never)} style={{ width: 42, paddingHorizontal: 0 }} />}
            />
            {recent.length === 0 ? (
              <EmptyState
                title={t('empty.title')}
                body={t('empty.transactions')}
                icon="receipt-outline"
                actionLabel={t('empty.addFirstTransaction')}
                actionIcon="add-circle-outline"
                onAction={() => navigation.navigate('Add' as never)}
              />
            ) : (
              <Card>
                {recent.map((transaction) => (
                  <TransactionItem
                    key={transaction.id}
                    transaction={transaction}
                    onPress={() => navigation.navigate('TransactionDetail' as never, { transactionId: transaction.id } as never)}
                  />
                ))}
              </Card>
            )}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
        <AppButton
          title={t('widgets.customize')}
          icon="options-outline"
          variant="secondary"
          onPress={() => setCustomizeVisible(true)}
          style={{ minHeight: 42 }}
        />
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <QuickAction icon="add-circle-outline" label={t('dashboard.quickAdd')} color={theme.colors.primary} onPress={() => navigation.navigate('Add' as never)} />
        <QuickAction icon="bar-chart-outline" label={t('nav.reports')} color={theme.colors.accent} onPress={() => navigation.navigate('Reports' as never)} />
        <QuickAction icon="wallet-outline" label={t('nav.wallets')} color={theme.colors.success} onPress={() => navigation.navigate('ManageWallets' as never)} />
        <QuickAction icon="settings-outline" label={t('nav.settings')} color={theme.colors.warning} onPress={() => navigation.navigate('Settings' as never)} />
      </View>

      <Card style={{ padding: 12 }}>
        <PickerField
          label={t('dashboard.viewing')}
          options={filterOptions}
          value={settings.dashboardCurrencyFilter}
          onChange={(dashboardCurrencyFilter) => updateSettings({ dashboardCurrencyFilter })}
          icon="cash-outline"
          searchable
        />
      </Card>

      {activeDashboardWidgets.length === 0 ? (
        <EmptyState
          title={t('widgets.allHiddenTitle')}
          body={t('widgets.allHiddenBody')}
          icon="options-outline"
          actionLabel={t('widgets.customizeDashboard')}
          actionIcon="options-outline"
          onAction={() => setCustomizeVisible(true)}
        />
      ) : (
        activeDashboardWidgets.map((widget) => <View key={widget.id}>{renderDashboardWidget(widget.id as DashboardWidgetId)}</View>)
      )}

      <WidgetCustomizeSheet
        visible={customizeVisible}
        title={t('widgets.customizeDashboard')}
        widgets={dashboardWidgets}
        preferences={settings.dashboardWidgets}
        onChange={(dashboardWidgets) => updateSettings({ dashboardWidgets })}
        onClose={() => setCustomizeVisible(false)}
      />
    </Screen>
  );
}
