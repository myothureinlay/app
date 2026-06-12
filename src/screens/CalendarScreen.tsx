import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { HorizontalBarChart } from '../components/ChartCard';
import { EmptyState } from '../components/EmptyState';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { SectionHeader } from '../components/SectionHeader';
import { TransactionItem } from '../components/TransactionItem';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useFinance } from '../context/FinanceContext';
import { useI18n } from '../i18n/useI18n';
import { isExpenseLike, isIncomeLike } from '../logic/ledger';
import { calculateReportSummary, groupTransactionsByCategory } from '../logic/reports';
import type { TransactionWithMeta } from '../types';
import { endOfMonth, formatMonth, shiftMonth, startOfMonth } from '../utils/dates';
import { formatMoney } from '../utils/money';

type CalendarMode = 'spending' | 'categories';

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function transactionDateKey(transaction: TransactionWithMeta) {
  return dateKey(new Date(transaction.date));
}

function calendarCells(month: Date) {
  const first = startOfMonth(month);
  const last = endOfMonth(month);
  const cells: Array<Date | null> = [];

  for (let index = 0; index < first.getDay(); index += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= last.getDate(); day += 1) {
    cells.push(new Date(first.getFullYear(), first.getMonth(), day));
  }

  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function compactAmount(value: number) {
  if (value >= 1000000) return `${Math.round(value / 1000000)}M`;
  if (value >= 1000) return `${Math.round(value / 1000)}K`;
  return value > 0 ? String(Math.round(value)) : '';
}

function isInMonth(transaction: TransactionWithMeta, month: Date) {
  const date = new Date(transaction.date);
  return date >= startOfMonth(month) && date <= endOfMonth(month);
}

export function CalendarScreen() {
  const navigation = useNavigation<any>();
  const { theme, settings } = useAppPreferences();
  const { transactions } = useFinance();
  const { t, locale } = useI18n();
  const [month, setMonth] = useState(startOfMonth());
  const [selectedKey, setSelectedKey] = useState(dateKey(new Date()));
  const [mode, setMode] = useState<CalendarMode>('spending');

  const monthTransactions = useMemo(
    () => transactions.filter((transaction) => !transaction.deletedAt && isInMonth(transaction, month)),
    [transactions, month]
  );
  const summary = calculateReportSummary(monthTransactions, settings.baseCurrency);
  const categoryRows = groupTransactionsByCategory(monthTransactions, settings.baseCurrency, 'expense').slice(0, 6);
  const cells = calendarCells(month);
  const weekdayLabels = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) =>
        new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(2026, 1, index + 1))
      ),
    [locale]
  );
  const daily = useMemo(() => {
    return monthTransactions.reduce<Record<string, { spending: number; income: number; count: number }>>((acc, transaction) => {
      const key = transactionDateKey(transaction);
      if (!acc[key]) acc[key] = { spending: 0, income: 0, count: 0 };
      if (isExpenseLike(transaction.type) || transaction.type === 'loss') acc[key].spending += transaction.baseAmount;
      if (isIncomeLike(transaction.type)) acc[key].income += transaction.baseAmount;
      acc[key].count += 1;
      return acc;
    }, {});
  }, [monthTransactions]);
  const maxDailySpend = Math.max(...Object.values(daily).map((row) => row.spending), 1);
  const selectedTransactions = monthTransactions
    .filter((transaction) => transactionDateKey(transaction) === selectedKey)
    .slice(0, 8);
  const selectedDay = daily[selectedKey];
  const moveMonth = (amount: number) => {
    const next = shiftMonth(month, amount);
    setMonth(next);
    setSelectedKey(dateKey(next));
  };

  return (
    <Screen>
      <ScreenHeader
        title={t('calendar.title')}
        subtitle={t('calendar.subtitle')}
        action={
          <AppButton
            title=""
            icon="today-outline"
            variant="secondary"
            onPress={() => {
              const today = new Date();
              setMonth(startOfMonth(today));
              setSelectedKey(dateKey(today));
            }}
            style={{ width: 48, paddingHorizontal: 0 }}
          />
        }
      />

      <Card style={{ gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <AppButton title="" icon="chevron-back-outline" variant="ghost" onPress={() => moveMonth(-1)} style={{ width: 42, paddingHorizontal: 0 }} />
          <Text style={{ flex: 1, color: theme.colors.text, fontSize: 18, fontWeight: '900', textAlign: 'center' }}>
            {formatMonth(month, locale)}
          </Text>
          <AppButton title="" icon="chevron-forward-outline" variant="ghost" onPress={() => moveMonth(1)} style={{ width: 42, paddingHorizontal: 0 }} />
        </View>

        <View style={{ flexDirection: 'row', padding: 4, borderRadius: 10, backgroundColor: theme.colors.surfaceElevated }}>
          {(['spending', 'categories'] as CalendarMode[]).map((item) => {
            const selected = mode === item;
            return (
              <Pressable
                key={item}
                accessibilityRole="button"
                onPress={() => setMode(item)}
                style={{
                  flex: 1,
                  minHeight: 34,
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: selected ? theme.colors.surface : 'transparent',
                }}
              >
                <Text style={{ color: selected ? theme.colors.text : theme.colors.textMuted, fontSize: 13, fontWeight: '900' }}>
                  {t(`calendar.${item}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ flexDirection: 'row' }}>
          {weekdayLabels.map((label) => (
            <Text key={label} style={{ flex: 1, color: theme.colors.textMuted, fontSize: 11, fontWeight: '900', textAlign: 'center' }}>
              {label}
            </Text>
          ))}
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {cells.map((cell, index) => {
            const key = cell ? dateKey(cell) : `empty-${index}`;
            const selected = key === selectedKey;
            const data = cell ? daily[key] : undefined;
            const spendWidth = data ? Math.max(14, (data.spending / maxDailySpend) * 100) : 0;

            return (
              <Pressable
                key={key}
                accessibilityRole={cell ? 'button' : undefined}
                disabled={!cell}
                onPress={() => cell && setSelectedKey(key)}
                style={{
                  width: '13.4%',
                  minHeight: 58,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: selected ? theme.colors.primary : theme.colors.border,
                  backgroundColor: selected ? `${theme.colors.primary}12` : cell ? theme.colors.surfaceElevated : 'transparent',
                  padding: 6,
                  justifyContent: 'space-between',
                }}
              >
                {cell ? (
                  <>
                    <Text style={{ color: selected ? theme.colors.primary : theme.colors.text, fontSize: 12, fontWeight: '900' }}>
                      {cell.getDate()}
                    </Text>
                    {data ? (
                      <View style={{ gap: 3 }}>
                        <View style={{ height: 4, borderRadius: 2, backgroundColor: `${theme.colors.danger}22`, overflow: 'hidden' }}>
                          <View style={{ width: `${spendWidth}%`, height: '100%', borderRadius: 2, backgroundColor: theme.colors.danger }} />
                        </View>
                        <Text style={{ color: theme.colors.textMuted, fontSize: 9, fontWeight: '800' }} numberOfLines={1}>
                          {compactAmount(data.spending)}
                        </Text>
                      </View>
                    ) : null}
                  </>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </Card>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Card style={{ flex: 1, gap: 4, padding: 12 }}>
          <Text style={{ color: theme.colors.textMuted, fontSize: 11, fontWeight: '900' }}>{t('calendar.monthSpending')}</Text>
          <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '900' }} numberOfLines={1}>
            {formatMoney(summary.expenses + summary.losses, settings.baseCurrency)}
          </Text>
        </Card>
        <Card style={{ flex: 1, gap: 4, padding: 12 }}>
          <Text style={{ color: theme.colors.textMuted, fontSize: 11, fontWeight: '900' }}>{t('dashboard.netCashflow')}</Text>
          <Text style={{ color: summary.netCashflow >= 0 ? theme.colors.success : theme.colors.danger, fontSize: 16, fontWeight: '900' }} numberOfLines={1}>
            {formatMoney(summary.netCashflow, settings.baseCurrency)}
          </Text>
        </Card>
      </View>

      {mode === 'categories' ? (
        <Card style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="pie-chart-outline" size={18} color={theme.colors.primary} />
            <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '900' }}>{t('calendar.categoryBreakdown')}</Text>
          </View>
          <HorizontalBarChart data={categoryRows.map((row) => ({ ...row, value: row.total }))} currency={settings.baseCurrency} />
        </Card>
      ) : (
        <>
          <SectionHeader title={t('calendar.selectedDay')} />
          <Card style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '800' }}>{t('calendar.daySpending')}</Text>
              <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '900' }}>
                {formatMoney(selectedDay?.spending ?? 0, settings.baseCurrency)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '800' }}>{t('calendar.entries')}</Text>
              <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '900' }}>{selectedDay?.count ?? 0}</Text>
            </View>
          </Card>

          {selectedTransactions.length === 0 ? (
            <EmptyState title={t('empty.title')} body={t('calendar.emptyDay')} icon="calendar-outline" />
          ) : (
            <Card>
              {selectedTransactions.map((transaction) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                  onPress={() => navigation.navigate('TransactionDetail' as never, { transactionId: transaction.id } as never)}
                />
              ))}
            </Card>
          )}
        </>
      )}
    </Screen>
  );
}
