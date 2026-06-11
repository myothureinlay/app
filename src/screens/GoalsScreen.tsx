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
import type { CurrencyCode, GoalType } from '../types';
import { formatMoney, parseNumber } from '../utils/money';

export function GoalsScreen() {
  const { theme } = useAppPreferences();
  const { goals, currencies, addGoal, removeGoalById, addContribution } = useFinance();
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [type, setType] = useState<GoalType>('target_amount');
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('');
  const [monthly, setMonthly] = useState('');
  const [deadline, setDeadline] = useState('');
  const [contribution, setContribution] = useState('');
  const currencyOptions = currencies.length > 0 ? currencies.filter((item) => item.isActive).map((item) => item.code) : ['USD'];

  const submit = async () => {
    if (!name.trim() || parseNumber(target) <= 0) {
      Alert.alert(t('goal.required'));
      return;
    }
    await addGoal({
      name: name.trim(),
      type,
      targetAmount: parseNumber(target),
      currency,
      currentAmount: parseNumber(current),
      monthlyTargetAmount: parseNumber(monthly) || null,
      deadline: deadline ? new Date(`${deadline}T23:59:59`).toISOString() : null,
      linkedWalletId: null,
      notes: null,
      icon: 'flag-outline',
      color: theme.colors.primary,
      status: 'active',
    });
    setName('');
    setTarget('');
    setCurrent('');
    setMonthly('');
  };

  return (
    <Screen>
      <ScreenHeader title={t('goal.title')} subtitle={t('goal.subtitle')} />
      <Card style={{ gap: 14 }}>
        <TextField label={t('goal.name')} value={name} onChangeText={setName} />
        <PickerField
          label={t('goal.type')}
          value={type}
          onChange={setType}
          options={[
            { label: t('goal.target'), value: 'target_amount' },
            { label: t('goal.monthly'), value: 'monthly_saving' },
            { label: t('goal.emergency'), value: 'emergency_fund' },
            { label: t('goal.debtPayoff'), value: 'debt_payoff' },
            { label: t('goal.custom'), value: 'custom' },
          ]}
        />
        <AmountInput label={t('goal.targetAmount')} value={target} onChangeText={setTarget} />
        <AmountInput label={t('goal.currentAmount')} value={current} onChangeText={setCurrent} />
        <AmountInput label={`${t('goal.monthlyTarget')} (${t('common.optional')})`} value={monthly} onChangeText={setMonthly} />
        <PickerField label={t('common.currency')} value={currency} onChange={setCurrency} options={currencyOptions.map((code) => ({ label: code, value: code }))} searchable />
        <DatePickerField label={`${t('goal.deadline')} (${t('common.optional')})`} value={deadline} onChangeText={setDeadline} />
        <AppButton title={t('goal.add')} icon="flag-outline" onPress={submit} />
      </Card>

      {goals.length === 0 ? (
        <EmptyState title={t('empty.title')} body={t('goal.empty')} icon="flag-outline" />
      ) : (
        goals.map((goal) => (
          <Card key={goal.id} style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '900' }}>{goal.name}</Text>
                <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>
                  {formatMoney(goal.currentAmount, goal.currency)} / {formatMoney(goal.targetAmount, goal.currency)}
                </Text>
              </View>
              <Text style={{ color: goal.status === 'completed' ? theme.colors.success : goal.color, fontWeight: '900' }}>
                {Math.round(goal.progress)}%
              </Text>
            </View>
            <View style={{ height: 10, borderRadius: 5, backgroundColor: theme.colors.surfaceElevated, overflow: 'hidden' }}>
              <View style={{ width: `${Math.min(100, goal.progress)}%`, height: '100%', backgroundColor: goal.color }} />
            </View>
            <Text style={{ color: theme.colors.textMuted, fontSize: 13 }}>
              {t('goal.remaining')}: {formatMoney(goal.remainingAmount, goal.currency)} · {t('goal.suggested')}: {formatMoney(goal.suggestedMonthlySaving, goal.currency)}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <AmountInput label={t('goal.contribution')} value={contribution} onChangeText={setContribution} />
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <AppButton
                title={t('goal.addContribution')}
                icon="add-outline"
                onPress={async () => {
                  const amount = parseNumber(contribution);
                  if (amount <= 0) return;
                  await addContribution({ goalId: goal.id, amount, currency: goal.currency, date: new Date().toISOString(), note: null, transactionId: null });
                  setContribution('');
                }}
                style={{ flex: 1 }}
              />
              <AppButton title={t('common.remove')} icon="trash-outline" variant="danger" onPress={() => removeGoalById(goal.id)} style={{ flex: 1 }} />
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}
