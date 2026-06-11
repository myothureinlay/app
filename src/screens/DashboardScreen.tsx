import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { ChartCard, DonutChart, LineTrendChart } from '../components/ChartCard';
import { ChipGroup } from '../components/ChipGroup';
import { EmptyState } from '../components/EmptyState';
import { Screen } from '../components/Screen';
import { SectionHeader } from '../components/SectionHeader';
import { StatCard } from '../components/StatCard';
import { TransactionItem } from '../components/TransactionItem';
import { WalletCard } from '../components/WalletCard';
import { CURRENCIES } from '../constants/currencies';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useFinance } from '../context/FinanceContext';
import { useI18n } from '../i18n/useI18n';
import {
  calculateReportSummary,
  monthlyIncomeExpense,
  totalWalletValue,
  walletDistribution,
} from '../logic/reports';
import type { CurrencyFilter, TransactionWithMeta } from '../types';
import { endOfMonth, startOfMonth } from '../utils/dates';
import { formatMoney } from '../utils/money';

function isThisMonth(transaction: TransactionWithMeta) {
  const date = new Date(transaction.date);
  return date >= startOfMonth() && date <= endOfMonth();
}

export function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { theme, settings, updateSettings } = useAppPreferences();
  const { isReady, wallets, budgets, goals, transactions } = useFinance();
  const { t } = useI18n();

  const monthlyTransactions = transactions.filter(isThisMonth);
  const filteredTransactions = monthlyTransactions.filter((transaction) =>
    settings.dashboardCurrencyFilter === 'all'
      ? true
      : transaction.currency === settings.dashboardCurrencyFilter
  );
  const summary = calculateReportSummary(monthlyTransactions, settings.baseCurrency);
  const recent = filteredTransactions.slice(0, 6);
  const trend = monthlyIncomeExpense(transactions, settings.baseCurrency, 6);
  const distribution = walletDistribution(wallets, settings.baseCurrency);
  const netWorth = totalWalletValue(wallets, settings.baseCurrency) + summary.receivableMovement - summary.liabilityMovement;
  const activeBudgetCount = budgets.length;
  const overBudgetCount = budgets.filter((budget) => budget.isOverBudget).length;
  const goalProgress =
    goals.length === 0 ? 0 : goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length;
  const filterOptions = [
    { label: t('common.all'), value: 'all' as CurrencyFilter },
    ...CURRENCIES.map((currency) => ({ label: currency, value: currency as CurrencyFilter })),
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
        colors={[theme.colors.primary, theme.colors.secondary, theme.colors.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: theme.radius.md,
          padding: 22,
          minHeight: 226,
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 16 }}>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 28, fontWeight: '900' }}>{t('dashboard.title')}</Text>
            <Text style={{ color: '#FFFFFFCC', fontSize: 14, fontWeight: '700' }}>{t('dashboard.subtitle')}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('Add' as never)}
            style={{
              width: 48,
              height: 48,
              borderRadius: theme.radius.md,
              backgroundColor: '#FFFFFF22',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="add-outline" size={26} color="#FFFFFF" />
          </Pressable>
        </View>
        <View>
          <Text style={{ color: '#FFFFFFBB', fontSize: 13, fontWeight: '700' }}>{t('dashboard.netWorth')}</Text>
          <Text style={{ color: '#FFFFFF', fontSize: 34, fontWeight: '900' }} numberOfLines={1} adjustsFontSizeToFit>
            {formatMoney(netWorth, settings.baseCurrency)}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1, backgroundColor: '#FFFFFF22', borderRadius: theme.radius.md, padding: 10 }}>
            <Text style={{ color: '#FFFFFFBB', fontSize: 11, fontWeight: '800' }}>{t('dashboard.monthlyIncome')}</Text>
            <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '900' }} numberOfLines={1}>
              {formatMoney(summary.income, settings.baseCurrency)}
            </Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#FFFFFF22', borderRadius: theme.radius.md, padding: 10 }}>
            <Text style={{ color: '#FFFFFFBB', fontSize: 11, fontWeight: '800' }}>{t('dashboard.netCashflow')}</Text>
            <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '900' }} numberOfLines={1}>
              {formatMoney(summary.netCashflow, settings.baseCurrency)}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ChipGroup
        options={filterOptions}
        value={settings.dashboardCurrencyFilter}
        onChange={(dashboardCurrencyFilter) => updateSettings({ dashboardCurrencyFilter })}
      />

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <StatCard
          label={t('dashboard.monthlyIncome')}
          value={summary.income}
          currency={settings.baseCurrency}
          icon="trending-up-outline"
          color={theme.colors.success}
        />
        <StatCard
          label={t('dashboard.monthlyExpenses')}
          value={summary.expenses + summary.losses}
          currency={settings.baseCurrency}
          icon="trending-down-outline"
          color={theme.colors.danger}
        />
      </View>

      <StatCard
        label={t('dashboard.netCashflow')}
        value={summary.netCashflow}
        currency={settings.baseCurrency}
        icon="pulse-outline"
        color={summary.netCashflow >= 0 ? theme.colors.success : theme.colors.danger}
      />

      <ChartCard title={t('dashboard.cashflowTrend')}>
        <LineTrendChart data={trend} />
      </ChartCard>

      <SectionHeader title={t('dashboard.planning')} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Card style={{ flex: 1, gap: 8 }}>
          <Ionicons name="speedometer-outline" size={22} color={overBudgetCount > 0 ? theme.colors.danger : theme.colors.primary} />
          <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '800' }}>{t('dashboard.budgets')}</Text>
          <Text style={{ color: theme.colors.text, fontSize: 20, fontWeight: '900' }}>
            {activeBudgetCount} · {overBudgetCount} {t('budget.over')}
          </Text>
        </Card>
        <Card style={{ flex: 1, gap: 8 }}>
          <Ionicons name="flag-outline" size={22} color={theme.colors.accent} />
          <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '800' }}>{t('dashboard.goals')}</Text>
          <Text style={{ color: theme.colors.text, fontSize: 20, fontWeight: '900' }}>{Math.round(goalProgress)}%</Text>
        </Card>
      </View>

      <SectionHeader title={t('dashboard.loanSnapshot')} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <StatCard
          label={t('dashboard.receivable')}
          value={summary.receivableMovement}
          currency={settings.baseCurrency}
          icon="arrow-down-circle-outline"
          color={theme.colors.success}
        />
        <StatCard
          label={t('dashboard.liability')}
          value={summary.liabilityMovement}
          currency={settings.baseCurrency}
          icon="arrow-up-circle-outline"
          color={theme.colors.warning}
        />
      </View>

      <SectionHeader title={t('dashboard.walletBalances')} />
      <ChartCard title={t('reports.walletBalances')}>
        <DonutChart data={distribution.map((row) => ({ ...row, value: Math.abs(row.total) }))} />
      </ChartCard>
      {wallets.slice(0, 4).map((wallet) => (
        <WalletCard key={wallet.id} wallet={wallet} />
      ))}

      <SectionHeader title={t('dashboard.quickActions')} />
      <Card style={{ flexDirection: 'row', gap: 10 }}>
        <AppButton title={t('dashboard.addIncome')} icon="trending-up-outline" onPress={() => navigation.navigate('Add' as never)} style={{ flex: 1 }} />
        <AppButton title={t('dashboard.addExpense')} icon="trending-down-outline" variant="secondary" onPress={() => navigation.navigate('Add' as never)} style={{ flex: 1 }} />
      </Card>

      <SectionHeader
        title={t('dashboard.recentTransactions')}
        action={<AppButton title={t('dashboard.quickAdd')} icon="add-outline" onPress={() => navigation.navigate('Add' as never)} />}
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
