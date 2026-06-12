import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { AmountInput } from '../components/AmountInput';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { DatePickerField } from '../components/DatePickerField';
import { EmptyState } from '../components/EmptyState';
import { PickerField } from '../components/PickerField';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { TextField } from '../components/TextField';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useFinance } from '../context/FinanceContext';
import { useI18n } from '../i18n/useI18n';
import { getCurrencyBadge } from '../constants/currencies';
import type { BudgetPeriod, CurrencyCode } from '../types';
import { formatMoney, parseNumber } from '../utils/money';

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function BudgetsScreen() {
  const { theme } = useAppPreferences();
  const { budgets, categories, currencies, addBudget, removeBudgetById } = useFinance();
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [limit, setLimit] = useState('');
  const [period, setPeriod] = useState<BudgetPeriod>('monthly');
  const [startDate, setStartDate] = useState(today());
  const [endDate, setEndDate] = useState('');
  const [threshold, setThreshold] = useState('80');
  const [notes, setNotes] = useState('');
  const currencyOptions = currencies.length > 0 ? currencies.filter((item) => item.isActive).map((item) => item.code) : ['USD'];

  const submit = async () => {
    if (!name.trim() || parseNumber(limit) <= 0) {
      Alert.alert(t('budget.required'));
      return;
    }
    await addBudget({
      name: name.trim(),
      categoryId: categoryId === 'all' ? null : categoryId,
      currency,
      amountLimit: parseNumber(limit),
      period,
      startDate: new Date(`${startDate}T00:00:00`).toISOString(),
      endDate: endDate ? new Date(`${endDate}T23:59:59`).toISOString() : null,
      notes,
      alertThreshold: parseNumber(threshold) || 80,
    });
    setName('');
    setLimit('');
    setNotes('');
  };

  return (
    <Screen>
      <ScreenHeader title={t('budget.title')} subtitle={t('budget.subtitle')} />
      <Card style={{ gap: 14 }}>
        <TextField label={t('budget.name')} value={name} onChangeText={setName} />
        <PickerField
          label={t('common.category')}
          value={categoryId}
          onChange={setCategoryId}
          options={[{ label: t('budget.allCategories'), value: 'all', icon: 'pricetags-outline' }, ...categories.map((category) => ({ label: category.name, value: category.id, icon: category.icon, color: category.color }))]}
          icon="pricetag-outline"
          searchable
        />
        <AmountInput label={t('budget.limit')} value={limit} onChangeText={setLimit} />
        <PickerField label={t('common.currency')} value={currency} onChange={setCurrency} options={currencyOptions.map((code) => ({ label: code, value: code, icon: 'cash-outline', badge: getCurrencyBadge(code) }))} icon="cash-outline" searchable />
        <PickerField
          label={t('budget.period')}
          value={period}
          onChange={setPeriod}
          options={[
            { label: t('budget.weekly'), value: 'weekly', icon: 'calendar-outline' },
            { label: t('budget.monthly'), value: 'monthly', icon: 'calendar-outline' },
            { label: t('budget.yearly'), value: 'yearly', icon: 'calendar-outline' },
            { label: t('budget.custom'), value: 'custom', icon: 'calendar-number-outline' },
          ]}
          icon="calendar-outline"
        />
        <DatePickerField label={t('dateRange.startDate')} value={startDate} onChangeText={setStartDate} />
        <DatePickerField label={`${t('dateRange.endDate')} (${t('common.optional')})`} value={endDate} onChangeText={setEndDate} />
        <TextField label={t('budget.threshold')} value={threshold} onChangeText={setThreshold} keyboardType="number-pad" />
        <TextField label={t('common.note')} value={notes} onChangeText={setNotes} multiline />
        <AppButton title={t('budget.add')} icon="add-circle-outline" onPress={submit} />
      </Card>

      {budgets.length === 0 ? (
        <EmptyState title={t('empty.title')} body={t('budget.empty')} icon="speedometer-outline" />
      ) : (
        budgets.map((budget) => (
          <Card key={budget.id} style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '900' }}>{budget.name}</Text>
                <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>{budget.categoryName ?? t('budget.allCategories')}</Text>
              </View>
              <Text style={{ color: budget.isOverBudget ? theme.colors.danger : theme.colors.primary, fontWeight: '900' }}>
                {Math.round(budget.progress)}%
              </Text>
            </View>
            <View style={{ height: 10, borderRadius: 5, backgroundColor: theme.colors.surfaceElevated, overflow: 'hidden' }}>
              <View style={{ width: `${Math.min(100, budget.progress)}%`, height: '100%', backgroundColor: budget.isOverBudget ? theme.colors.danger : theme.colors.primary }} />
            </View>
            <Text style={{ color: theme.colors.textMuted, fontSize: 13 }}>
              {formatMoney(budget.usedAmount, budget.currency)} / {formatMoney(budget.amountLimit, budget.currency)}
            </Text>
            <AppButton title={t('common.remove')} icon="trash-outline" variant="danger" onPress={() => removeBudgetById(budget.id)} />
          </Card>
        ))
      )}
    </Screen>
  );
}
