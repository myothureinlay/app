import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { CategoryChart } from '../components/CategoryChart';
import { ChipGroup } from '../components/ChipGroup';
import { Screen } from '../components/Screen';
import { SectionHeader } from '../components/SectionHeader';
import { StatCard } from '../components/StatCard';
import { TransactionItem } from '../components/TransactionItem';
import { CURRENCIES } from '../constants/currencies';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useFinance } from '../context/FinanceContext';
import { useI18n } from '../i18n/useI18n';
import type { CurrencyFilter, SummaryTotals, TransactionWithMeta } from '../types';
import { endOfMonth, startOfMonth } from '../utils/dates';
import { formatMoney } from '../utils/money';

function isThisMonth(transaction: TransactionWithMeta) {
  const date = new Date(transaction.date);
  return date >= startOfMonth() && date <= endOfMonth();
}

function calculateTotals(
  transactions: TransactionWithMeta[],
  currencyFilter: CurrencyFilter,
  baseCurrency: SummaryTotals['currencyLabel']
): SummaryTotals {
  const relevant = transactions.filter((transaction) =>
    currencyFilter === 'all' ? transaction.baseCurrency === baseCurrency : transaction.currency === currencyFilter
  );
  const income = relevant
    .filter((transaction) => transaction.type === 'income')
    .reduce((sum, transaction) => sum + (currencyFilter === 'all' ? transaction.baseAmount : transaction.amount), 0);
  const expenses = relevant
    .filter((transaction) => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + (currencyFilter === 'all' ? transaction.baseAmount : transaction.amount), 0);
  const hasMixedBaseCurrency =
    currencyFilter === 'all' &&
    transactions.some(
      (transaction) => transaction.type !== 'transfer' && transaction.baseCurrency !== baseCurrency
    );

  return {
    income,
    expenses,
    balance: income - expenses,
    currencyLabel: currencyFilter === 'all' ? baseCurrency : currencyFilter,
    hasMixedBaseCurrency,
  };
}

export function DashboardScreen() {
  const navigation = useNavigation();
  const { theme, settings, updateSettings } = useAppPreferences();
  const { isReady, transactions } = useFinance();
  const { t } = useI18n();

  const monthlyTransactions = transactions.filter(isThisMonth);
  const filteredTransactions = monthlyTransactions.filter((transaction) =>
    settings.dashboardCurrencyFilter === 'all'
      ? true
      : transaction.currency === settings.dashboardCurrencyFilter
  );
  const totals = calculateTotals(
    monthlyTransactions,
    settings.dashboardCurrencyFilter,
    settings.baseCurrency
  );
  const recent = filteredTransactions.slice(0, 5);
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
          borderRadius: 8,
          padding: 20,
          minHeight: 184,
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
              borderRadius: 8,
              backgroundColor: '#FFFFFF22',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="add" size={26} color="#FFFFFF" />
          </Pressable>
        </View>
        <View>
          <Text style={{ color: '#FFFFFFBB', fontSize: 13, fontWeight: '700' }}>{t('dashboard.balance')}</Text>
          <Text style={{ color: '#FFFFFF', fontSize: 34, fontWeight: '900' }} numberOfLines={1} adjustsFontSizeToFit>
            {formatMoney(totals.balance, totals.currencyLabel as never)}
          </Text>
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
          value={totals.income}
          currency={totals.currencyLabel}
          icon="arrow-down"
          color={theme.colors.success}
        />
        <StatCard
          label={t('dashboard.monthlyExpenses')}
          value={totals.expenses}
          currency={totals.currencyLabel}
          icon="arrow-up"
          color={theme.colors.danger}
        />
      </View>

      {totals.hasMixedBaseCurrency ? (
        <Card style={{ backgroundColor: `${theme.colors.warning}18`, borderColor: `${theme.colors.warning}66` }}>
          <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '700' }}>
            {t('dashboard.mixedBase')}
          </Text>
        </Card>
      ) : null}

      <SectionHeader title={t('dashboard.categorySpending')} />
      <CategoryChart transactions={filteredTransactions} />

      <SectionHeader
        title={t('dashboard.recentTransactions')}
        action={<AppButton title={t('dashboard.quickAdd')} icon="add" onPress={() => navigation.navigate('Add' as never)} />}
      />
      <Card>
        {recent.length === 0 ? (
          <Text style={{ color: theme.colors.textMuted, fontSize: 14 }}>{t('dashboard.empty')}</Text>
        ) : (
          recent.map((transaction) => <TransactionItem key={transaction.id} transaction={transaction} />)
        )}
      </Card>
    </Screen>
  );
}
