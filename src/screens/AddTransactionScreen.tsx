import { useEffect, useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { ChipGroup } from '../components/ChipGroup';
import { Screen } from '../components/Screen';
import { SectionHeader } from '../components/SectionHeader';
import { SegmentedControl } from '../components/SegmentedControl';
import { TextField } from '../components/TextField';
import { BASE_CURRENCIES, CURRENCIES, defaultRatesToBase } from '../constants/currencies';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useFinance } from '../context/FinanceContext';
import { useI18n } from '../i18n/useI18n';
import type { BaseCurrency, CurrencyCode, TransactionType } from '../types';
import { parseNumber } from '../utils/money';

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function toIsoDate(value: string) {
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

export function AddTransactionScreen() {
  const { theme, settings, setBaseCurrency } = useAppPreferences();
  const { wallets, categories, addTransaction } = useFinance();
  const { t } = useI18n();

  const firstWallet = wallets[0];
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>(firstWallet?.currency ?? 'USDT');
  const [walletId, setWalletId] = useState(firstWallet?.id ?? '');
  const [toWalletId, setToWalletId] = useState('');
  const [receivedAmount, setReceivedAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(todayInputValue());
  const [note, setNote] = useState('');
  const [exchangeRate, setExchangeRate] = useState(
    String(defaultRatesToBase[settings.baseCurrency][currency])
  );

  const selectedWallet = wallets.find((wallet) => wallet.id === walletId);
  const toWallet = wallets.find((wallet) => wallet.id === toWalletId);
  const availableCategories = categories.filter((category) => category.type === type);
  const amountNumber = parseNumber(amount);
  const exchangeRateNumber = parseNumber(exchangeRate) || defaultRatesToBase[settings.baseCurrency][currency];
  const baseAmount = amountNumber * exchangeRateNumber;

  useEffect(() => {
    if (!walletId && wallets[0]) {
      setWalletId(wallets[0].id);
      setCurrency(wallets[0].currency);
    }
  }, [walletId, wallets]);

  useEffect(() => {
    if (selectedWallet) {
      setCurrency(selectedWallet.currency);
    }
  }, [selectedWallet?.id]);

  useEffect(() => {
    setExchangeRate(String(defaultRatesToBase[settings.baseCurrency][currency]));
  }, [currency, settings.baseCurrency]);

  useEffect(() => {
    const firstCategory = availableCategories[0];
    setCategoryId(firstCategory?.id ?? '');
  }, [type, categories.length]);

  useEffect(() => {
    if (type === 'transfer') {
      const destination = wallets.find((wallet) => wallet.id !== walletId);
      setToWalletId((current) => current || destination?.id || '');
    }
  }, [type, walletId, wallets]);

  const typeOptions = useMemo(
    () => [
      { label: t('common.income'), value: 'income' as TransactionType, icon: 'arrow-down' },
      { label: t('common.expense'), value: 'expense' as TransactionType, icon: 'arrow-up' },
      { label: t('common.exchange'), value: 'transfer' as TransactionType, icon: 'swap-horizontal' },
    ],
    [t]
  );

  const submit = async () => {
    if (!walletId || amountNumber <= 0) {
      Alert.alert(t('transaction.required'));
      return;
    }

    if (type === 'transfer' && (!toWalletId || parseNumber(receivedAmount) <= 0)) {
      Alert.alert(t('transaction.required'));
      return;
    }

    await addTransaction({
      type,
      amount: amountNumber,
      currency,
      walletId,
      toWalletId: type === 'transfer' ? toWalletId : null,
      toAmount: type === 'transfer' ? parseNumber(receivedAmount) : null,
      toCurrency: type === 'transfer' ? toWallet?.currency ?? null : null,
      categoryId: categoryId || null,
      date: toIsoDate(date),
      note,
      exchangeRate: exchangeRateNumber,
      baseCurrency: settings.baseCurrency,
      baseAmount,
    });

    setAmount('');
    setReceivedAmount('');
    setNote('');
    setDate(todayInputValue());
    Alert.alert(t('transaction.saved'));
  };

  return (
    <Screen>
      <SectionHeader title={t('transaction.title')} />

      <SegmentedControl options={typeOptions} value={type} onChange={setType} />

      {type === 'transfer' ? (
        <Card style={{ backgroundColor: `${theme.colors.secondary}14`, borderColor: `${theme.colors.secondary}55` }}>
          <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '700' }}>
            {t('transaction.transferHint')}
          </Text>
        </Card>
      ) : null}

      <Card style={{ gap: 16 }}>
        <TextField
          label={t('common.amount')}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0.00"
        />

        <View style={{ gap: 8 }}>
          <Text style={{ color: theme.colors.textMuted, fontSize: 13, fontWeight: '700' }}>{t('common.wallet')}</Text>
          <ChipGroup
            value={walletId}
            onChange={setWalletId}
            options={wallets.map((wallet) => ({
              value: wallet.id,
              label: wallet.name,
              icon: wallet.icon,
              color: wallet.color,
            }))}
          />
        </View>

        <View style={{ gap: 8 }}>
          <Text style={{ color: theme.colors.textMuted, fontSize: 13, fontWeight: '700' }}>{t('common.currency')}</Text>
          <ChipGroup
            value={currency}
            onChange={setCurrency}
            options={CURRENCIES.map((item) => ({ value: item, label: item }))}
          />
        </View>

        {type === 'transfer' ? (
          <>
            <View style={{ gap: 8 }}>
              <Text style={{ color: theme.colors.textMuted, fontSize: 13, fontWeight: '700' }}>
                {t('transaction.toWallet')}
              </Text>
              <ChipGroup
                value={toWalletId}
                onChange={setToWalletId}
                options={wallets
                  .filter((wallet) => wallet.id !== walletId)
                  .map((wallet) => ({
                    value: wallet.id,
                    label: wallet.name,
                    icon: wallet.icon,
                    color: wallet.color,
                  }))}
              />
            </View>
            <TextField
              label={`${t('transaction.receivedAmount')} (${toWallet?.currency ?? ''})`}
              value={receivedAmount}
              onChangeText={setReceivedAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
            />
          </>
        ) : (
          <View style={{ gap: 8 }}>
            <Text style={{ color: theme.colors.textMuted, fontSize: 13, fontWeight: '700' }}>
              {t('common.category')}
            </Text>
            <ChipGroup
              value={categoryId}
              onChange={setCategoryId}
              options={availableCategories.map((category) => ({
                value: category.id,
                label: category.name,
                icon: category.icon,
                color: category.color,
              }))}
            />
          </View>
        )}
      </Card>

      <Card style={{ gap: 16 }}>
        <View style={{ gap: 8 }}>
          <Text style={{ color: theme.colors.textMuted, fontSize: 13, fontWeight: '700' }}>
            {t('transaction.baseCurrency')}
          </Text>
          <ChipGroup
            value={settings.baseCurrency}
            onChange={(value) => setBaseCurrency(value as BaseCurrency)}
            options={BASE_CURRENCIES.map((item) => ({ value: item, label: item }))}
          />
        </View>
        <TextField
          label={t('transaction.exchangeRate')}
          value={exchangeRate}
          onChangeText={setExchangeRate}
          keyboardType="decimal-pad"
        />
        <TextField
          label={t('transaction.baseAmount')}
          value={String(Math.round(baseAmount * 100) / 100)}
          editable={false}
        />
      </Card>

      <Card style={{ gap: 16 }}>
        <TextField label={t('common.date')} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
        <TextField
          label={`${t('common.note')} (${t('common.optional')})`}
          value={note}
          onChangeText={setNote}
          placeholder={t('transaction.notePlaceholder')}
          multiline
        />
      </Card>

      <AppButton title={t('common.save')} icon="checkmark" onPress={submit} />
    </Screen>
  );
}
