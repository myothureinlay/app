import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { BottomSheet } from '../components/BottomSheet';
import { Card } from '../components/Card';
import { ChartCard, LineTrendChart } from '../components/ChartCard';
import { EmptyState } from '../components/EmptyState';
import { PickerField } from '../components/PickerField';
import { Screen } from '../components/Screen';
import { SectionHeader } from '../components/SectionHeader';
import { WalletCard } from '../components/WalletCard';
import { WidgetCustomizeSheet, visibleWidgets, type WidgetDescriptor } from '../components/WidgetCustomizeSheet';
import { BUILD_INFO } from '../constants/build';
import { getCurrencyBadge } from '../constants/currencies';
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
  const [accountVisible, setAccountVisible] = useState(false);

  const monthlyTransactions = transactions.filter(isThisMonth);
  const summary = calculateReportSummary(monthlyTransactions, settings.baseCurrency);
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
      .map((currency) => ({
        label: currency.code,
        value: currency.code as CurrencyFilter,
        icon: 'cash-outline',
        badge: getCurrencyBadge(currency.code),
        color: theme.colors.success,
      })),
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
    ],
    [t, theme]
  );
  const activeDashboardWidgets = visibleWidgets(dashboardWidgets, settings.dashboardWidgets);
  const isAurora = settings.theme === 'auroraGlass';
  const accountSections = [
    {
      title: t('settings.appearance'),
      rows: [
        { route: 'ThemePicker', label: t('settings.themePicker'), icon: 'color-palette-outline' },
        { route: 'LanguagePicker', label: t('settings.languagePicker'), icon: 'language-outline' },
        {
          route: 'Settings',
          label: t('settings.iconStyle'),
          icon: 'sparkles-outline',
          detail: settings.iconStyle === 'filled' ? t('settings.filledIcons') : t('settings.lineIcons'),
        },
        { route: 'Settings', label: t('settings.baseCurrency'), icon: 'cash-outline', detail: settings.baseCurrency },
      ],
    },
    {
      title: t('settings.data'),
      rows: [
        { route: 'ManageWallets', label: t('settings.manageWallets'), icon: 'wallet-outline' },
        { route: 'ManageCategories', label: t('settings.manageCategories'), icon: 'pricetags-outline' },
        { route: 'Settings', label: t('settings.manageExchangeRates'), icon: 'swap-horizontal-outline' },
        { route: 'ManageCurrencies', label: t('settings.manageCurrencies'), icon: 'cash-outline' },
        { route: 'GoogleBackup', label: t('settings.backupRestore'), icon: 'archive-outline' },
      ],
    },
    {
      title: t('account.support'),
      rows: [
        { route: 'UserManual', label: t('settings.userManual'), icon: 'book-outline' },
        { route: 'Notifications', label: t('settings.notifications'), icon: 'notifications-outline' },
        { route: 'About', label: t('settings.aboutApp'), icon: 'information-circle-outline' },
      ],
    },
  ];

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
            colors={
              isAurora
                ? ['#0B1E35', '#123D68', '#4C1D95', '#F6C85F']
                : [theme.colors.primaryDark, theme.colors.primary, theme.colors.accent]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: theme.radius.lg + 6, padding: 18, gap: 18, overflow: 'hidden' }}
          >
            <View
              style={{
                position: 'absolute',
                right: -42,
                top: -42,
                width: 150,
                height: 150,
                borderRadius: 75,
                backgroundColor: '#FFFFFF18',
              }}
            />
            <View
              style={{
                position: 'absolute',
                left: -58,
                bottom: -70,
                width: 190,
                height: 190,
                borderRadius: 95,
                backgroundColor: '#00000010',
              }}
            />
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
              <View style={{ flex: 1, gap: 5 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setAccountVisible(true)}
                    style={({ pressed }) => ({
                      width: 38,
                      height: 38,
                      borderRadius: 19,
                      backgroundColor: pressed ? '#FFFFFF30' : '#FFFFFF22',
                      alignItems: 'center',
                      justifyContent: 'center',
                    })}
                  >
                    <Ionicons name="person-circle-outline" size={24} color="#FFFFFF" />
                  </Pressable>
                  <View
                    style={{
                      alignSelf: 'flex-start',
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 999,
                      backgroundColor: '#FFFFFF22',
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '900' }}>{t('dashboard.v7Label')}</Text>
                  </View>
                </View>
                <Text style={{ color: '#FFFFFFC8', fontSize: 13, fontWeight: '800' }}>{t('dashboard.greeting')}</Text>
                <Text style={{ color: '#FFFFFF', fontSize: 27, fontWeight: '900' }}>{t('dashboard.title')}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setCustomizeVisible(true)}
                  style={({ pressed }) => ({
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    backgroundColor: pressed ? '#FFFFFF30' : '#FFFFFF20',
                    alignItems: 'center',
                    justifyContent: 'center',
                  })}
                >
                  <Ionicons name="options-outline" size={21} color="#FFFFFF" />
                </Pressable>
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
            </View>

            <View style={{ gap: 5 }}>
              <Text style={{ color: '#FFFFFFB8', fontSize: 12, fontWeight: '800' }}>{t('dashboard.netWorth')}</Text>
              <Text style={{ color: '#FFFFFF', fontSize: 35, fontWeight: '900' }} numberOfLines={1} adjustsFontSizeToFit>
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
              action={<AppButton title="" icon="add-outline" onPress={() => navigation.navigate('Budgets' as never)} style={{ width: 44, minHeight: 44, borderRadius: 22, paddingHorizontal: 0 }} />}
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
              action={<AppButton title="" icon="add-outline" onPress={() => navigation.navigate('Goals' as never)} style={{ width: 44, minHeight: 44, borderRadius: 22, paddingHorizontal: 0 }} />}
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
              action={<AppButton title="" icon="add-outline" onPress={() => navigation.navigate('ManageWallets' as never)} style={{ width: 44, minHeight: 44, borderRadius: 22, paddingHorizontal: 0 }} />}
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
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingHorizontal: 2, paddingRight: 18 }}
                style={{ marginHorizontal: -2 }}
              >
                {wallets.slice(0, 6).map((wallet) => (
                  <View key={wallet.id} style={{ width: 282 }}>
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
      default:
        return null;
    }
  };

  return (
    <Screen>
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

      <WidgetCustomizeSheet
        visible={customizeVisible}
        title={t('widgets.customizeDashboard')}
        widgets={dashboardWidgets}
        preferences={settings.dashboardWidgets}
        onChange={(dashboardWidgets) => updateSettings({ dashboardWidgets })}
        onClose={() => setCustomizeVisible(false)}
      />
      <BottomSheet visible={accountVisible} title={t('account.title')} onClose={() => setAccountVisible(false)}>
        {accountSections.map((section) => (
          <View key={section.title} style={{ gap: 7 }}>
            <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '900' }}>{section.title}</Text>
            <View style={{ gap: 6 }}>
              {section.rows.map((row) => (
                <Pressable
                  key={`${section.title}-${row.label}`}
                  accessibilityRole="button"
                  onPress={() => {
                    setAccountVisible(false);
                    navigation.navigate(row.route as never);
                  }}
                  style={({ pressed }) => ({
                    minHeight: 44,
                    borderRadius: theme.radius.md,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    backgroundColor: pressed ? theme.colors.surfaceElevated : theme.colors.surface,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                  })}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      backgroundColor: `${theme.colors.primary}18`,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name={row.icon as never} size={19} color={theme.colors.primary} />
                  </View>
                  <Text style={{ flex: 1, color: theme.colors.text, fontSize: 14, fontWeight: '900' }} numberOfLines={1}>
                    {row.label}
                  </Text>
                  {row.detail ? (
                    <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '800' }} numberOfLines={1}>
                      {row.detail}
                    </Text>
                  ) : null}
                  <Ionicons name="chevron-forward-outline" size={17} color={theme.colors.textMuted} />
                </Pressable>
              ))}
            </View>
          </View>
        ))}
        <View style={{ gap: 7 }}>
          <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '900' }}>{t('account.build')}</Text>
          <Card style={{ gap: 3, padding: 10, backgroundColor: `${theme.colors.primary}10`, borderColor: `${theme.colors.primary}30` }}>
            <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '900' }}>{BUILD_INFO.shortLabel}</Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: 12 }} numberOfLines={1}>
              {BUILD_INFO.label}
            </Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: 11 }}>
              {BUILD_INFO.appVersion} · {BUILD_INFO.buildId}
            </Text>
          </Card>
        </View>
      </BottomSheet>
    </Screen>
  );
}
