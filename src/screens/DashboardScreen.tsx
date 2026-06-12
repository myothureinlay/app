import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
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
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useFinance } from '../context/FinanceContext';
import { useI18n } from '../i18n/useI18n';
import { calculateReportSummary, monthlyIncomeExpense, totalWalletValue } from '../logic/reports';
import type { CurrencyFilter, TransactionWithMeta } from '../types';
import { endOfMonth, startOfMonth } from '../utils/dates';
import { formatMoney } from '../utils/money';

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
    { label: t('common.all'), value: 'all' as CurrencyFilter },
    ...currencies
      .filter((currency) => currency.isActive)
      .map((currency) => ({ label: currency.code, value: currency.code as CurrencyFilter })),
  ];

  if (!isReady) {
    return (
      <Screen scroll={false} contentStyle={{ alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={theme.colors.primary} />
      </Screen>
    );
  }

  return (
    <Screen>
      <LinearGradient
        colors={[theme.colors.primaryDark, theme.colors.primary, theme.colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 18, padding: 18, gap: 18 }}
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

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <QuickAction icon="add-circle-outline" label={t('dashboard.quickAdd')} color={theme.colors.primary} onPress={() => navigation.navigate('Add' as never)} />
        <QuickAction icon="calendar-clear-outline" label={t('nav.calendar')} color={theme.colors.secondary} onPress={() => navigation.navigate('Calendar' as never)} />
        <QuickAction icon="bar-chart-outline" label={t('nav.reports')} color={theme.colors.accent} onPress={() => navigation.navigate('Reports' as never)} />
        <QuickAction icon="wallet-outline" label={t('nav.wallets')} color={theme.colors.success} onPress={() => navigation.navigate('ManageWallets' as never)} />
      </View>

      <Card style={{ padding: 12 }}>
        <PickerField
          label={t('dashboard.viewing')}
          options={filterOptions}
          value={settings.dashboardCurrencyFilter}
          onChange={(dashboardCurrencyFilter) => updateSettings({ dashboardCurrencyFilter })}
          searchable
        />
      </Card>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <SummaryTile
          label={t('dashboard.monthlyIncome')}
          value={formatMoney(summary.income, settings.baseCurrency)}
          icon="trending-up-outline"
          color={theme.colors.success}
        />
        <SummaryTile
          label={t('dashboard.monthlyExpenses')}
          value={formatMoney(summary.expenses + summary.losses, settings.baseCurrency)}
          icon="trending-down-outline"
          color={theme.colors.danger}
        />
      </View>

      <Card style={{ gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <View>
            <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '900' }}>{t('dashboard.monthlyPulse')}</Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 2 }}>{t('dashboard.monthlyPulseBody')}</Text>
          </View>
          <Text style={{ color: summary.netCashflow >= 0 ? theme.colors.success : theme.colors.danger, fontSize: 15, fontWeight: '900' }}>
            {formatMoney(summary.netCashflow, settings.baseCurrency)}
          </Text>
        </View>
        <ProgressBar value={summary.income <= 0 ? 0 : Math.max(0, (summary.netCashflow / summary.income) * 100)} color={summary.netCashflow >= 0 ? theme.colors.success : theme.colors.danger} />
      </Card>

      <ChartCard title={t('dashboard.cashflowTrend')}>
        <LineTrendChart data={trend} />
      </ChartCard>

      <SectionHeader title={t('dashboard.planning')} />
      <Card style={{ gap: 16 }}>
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
            <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '900' }}>{t('dashboard.budgets')}</Text>
            <Text style={{ color: overBudgetCount > 0 ? theme.colors.danger : theme.colors.textMuted, fontSize: 13, fontWeight: '900' }}>
              {overBudgetCount} {t('budget.over')}
            </Text>
          </View>
          <ProgressBar value={budgetProgress} color={overBudgetCount > 0 ? theme.colors.danger : theme.colors.primary} />
        </View>
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
            <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '900' }}>{t('dashboard.goals')}</Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: 13, fontWeight: '900' }}>{Math.round(goalProgress)}%</Text>
          </View>
          <ProgressBar value={goalProgress} color={theme.colors.accent} />
        </View>
      </Card>

      <SectionHeader title={t('dashboard.walletBalances')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 20 }}>
        {wallets.slice(0, 6).map((wallet) => (
          <View key={wallet.id} style={{ width: 270 }}>
            <WalletCard wallet={wallet} />
          </View>
        ))}
      </ScrollView>

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

      <SectionHeader
        title={t('dashboard.recentTransactions')}
        action={<AppButton title="" icon="add-outline" onPress={() => navigation.navigate('Add' as never)} style={{ width: 42, paddingHorizontal: 0 }} />}
      />
      {recent.length === 0 ? (
        <EmptyState title={t('empty.title')} body={t('empty.transactions')} />
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
    </Screen>
  );
}
