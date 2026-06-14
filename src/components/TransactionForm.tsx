import { useEffect, useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { BASE_CURRENCIES, getCurrencyBadge, getRateToBase } from '../constants/currencies';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useFinance } from '../context/FinanceContext';
import { useI18n } from '../i18n/useI18n';
import {
  categoryTypeForTransaction,
  reportColorByType,
  transactionNeedsDestination,
  transactionSupportsCounterparty,
  transactionSupportsFees,
  transactionTypeIcons,
  transactionTypes,
} from '../logic/ledger';
import type { BaseCurrency, CreateTransactionInput, CurrencyCode, Transaction, TransactionType } from '../types';
import { parseNumber } from '../utils/money';
import { AmountInput } from './AmountInput';
import { AppButton } from './AppButton';
import { Card } from './Card';
import { CategoryPicker } from './CategoryPicker';
import { CurrencyPicker } from './CurrencyPicker';
import { DatePickerField } from './DatePickerField';
import { SelectField } from './SelectField';
import { TextField } from './TextField';

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function toIsoDate(value: string) {
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function fromIsoDate(value?: string) {
  return value ? new Date(value).toISOString().slice(0, 10) : todayInputValue();
}

interface TransactionFormProps {
  initialTransaction?: Transaction | null;
  initialType?: TransactionType;
  submitLabel: string;
  onSubmit: (input: CreateTransactionInput) => Promise<void>;
}

export function TransactionForm({ initialTransaction, initialType, submitLabel, onSubmit }: TransactionFormProps) {
  const { theme, settings, setBaseCurrency } = useAppPreferences();
  const { wallets, categories, currencies } = useFinance();
  const { t } = useI18n();

  const firstWallet = wallets[0];
  const [type, setType] = useState<TransactionType>(initialTransaction?.type ?? initialType ?? 'expense');
  const [amount, setAmount] = useState(initialTransaction ? String(initialTransaction.amount) : '');
  const [currency, setCurrency] = useState<CurrencyCode>(initialTransaction?.currency ?? firstWallet?.currency ?? 'USDT');
  const [walletId, setWalletId] = useState(initialTransaction?.walletId ?? firstWallet?.id ?? '');
  const [toWalletId, setToWalletId] = useState(initialTransaction?.toWalletId ?? '');
  const [receivedAmount, setReceivedAmount] = useState(initialTransaction?.toAmount ? String(initialTransaction.toAmount) : '');
  const [categoryId, setCategoryId] = useState(initialTransaction?.categoryId ?? '');
  const [parentCategoryId, setParentCategoryId] = useState(initialTransaction?.parentCategoryId ?? '');
  const [subcategoryId, setSubcategoryId] = useState(initialTransaction?.subcategoryId ?? '');
  const [date, setDate] = useState(fromIsoDate(initialTransaction?.date));
  const [note, setNote] = useState(initialTransaction?.note ?? '');
  const [counterparty, setCounterparty] = useState(initialTransaction?.counterparty ?? '');
  const [feeAmount, setFeeAmount] = useState(initialTransaction?.feeAmount ? String(initialTransaction.feeAmount) : '');
  const [feeCurrency, setFeeCurrency] = useState<CurrencyCode>(initialTransaction?.feeCurrency ?? currency);
  const [baseCurrency, setBaseCurrencyState] = useState<BaseCurrency>(initialTransaction?.baseCurrency ?? settings.baseCurrency);
  const [exchangeRate, setExchangeRate] = useState(String(initialTransaction?.exchangeRate ?? getRateToBase(settings.baseCurrency, currency)));

  const selectedWallet = wallets.find((wallet) => wallet.id === walletId);
  const toWallet = wallets.find((wallet) => wallet.id === toWalletId);
  const needsDestination = transactionNeedsDestination(type);
  const supportsFees = transactionSupportsFees(type);
  const supportsCounterparty = transactionSupportsCounterparty(type);
  const availableCategories = categories.filter((category) => category.type === categoryTypeForTransaction(type));
  const parentCategories = availableCategories.filter((category) => !category.parentId);
  const amountNumber = parseNumber(amount);
  const exchangeRateNumber = parseNumber(exchangeRate) || getRateToBase(baseCurrency, currency);
  const baseAmount = amountNumber * exchangeRateNumber;
  const baseCurrencyOptions = currencies.length > 0 ? currencies.filter((item) => item.isActive).map((item) => item.code) : BASE_CURRENCIES;

  useEffect(() => {
    if (!walletId && wallets[0]) {
      setWalletId(wallets[0].id);
      setCurrency(wallets[0].currency);
      setFeeCurrency(wallets[0].currency);
    }
  }, [walletId, wallets]);

  useEffect(() => {
    if (selectedWallet && !initialTransaction) {
      setCurrency(selectedWallet.currency);
      setFeeCurrency(selectedWallet.currency);
    }
  }, [selectedWallet?.id]);

  useEffect(() => {
    if (!initialTransaction) {
      setExchangeRate(String(getRateToBase(baseCurrency, currency)));
    }
  }, [currency, baseCurrency, initialTransaction]);

  useEffect(() => {
    const category = availableCategories.find((item) => item.id === categoryId);
    const selectedParent = parentCategoryId ? availableCategories.find((item) => item.id === parentCategoryId) : null;
    const firstParent = parentCategories[0];

    if (category?.parentId && !parentCategoryId) {
      setParentCategoryId(category.parentId);
      setSubcategoryId(category.id);
      return;
    }

    if (category && !category.parentId && !parentCategoryId) {
      setParentCategoryId(category.id);
      return;
    }

    if (!selectedParent) {
      setParentCategoryId(firstParent?.id ?? '');
      setSubcategoryId('');
      setCategoryId(firstParent?.id ?? '');
    }
  }, [type, categories.length, categoryId, parentCategoryId, parentCategories.length]);

  useEffect(() => {
    if (needsDestination) {
      const destination = wallets.find((wallet) => wallet.id !== walletId);
      setToWalletId((current) => current || destination?.id || '');
    }
  }, [needsDestination, walletId, wallets]);

  const typeOptions = useMemo(
    () =>
      transactionTypes.map((item) => ({
        label: t(`types.${item}`),
        value: item,
        icon: transactionTypeIcons[item],
        color: reportColorByType[item],
      })),
    [t]
  );

  const submit = async () => {
    if (!walletId || amountNumber <= 0) {
      Alert.alert(t('transaction.required'));
      return;
    }

    if (needsDestination && (!toWalletId || parseNumber(receivedAmount) <= 0)) {
      Alert.alert(t('transaction.transferRequired'));
      return;
    }

    await onSubmit({
      type,
      amount: amountNumber,
      currency,
      walletId,
      toWalletId: needsDestination ? toWalletId : null,
      toAmount: needsDestination ? parseNumber(receivedAmount) : null,
      toCurrency: needsDestination ? toWallet?.currency ?? null : null,
      categoryId: categoryId || null,
      parentCategoryId: parentCategoryId || categoryId || null,
      subcategoryId: subcategoryId || null,
      date: toIsoDate(date),
      note,
      exchangeRate: exchangeRateNumber,
      baseCurrency,
      baseAmount,
      counterparty: supportsCounterparty ? counterparty : null,
      feeAmount: supportsFees ? parseNumber(feeAmount) : 0,
      feeCurrency: supportsFees ? feeCurrency : null,
    });

    if (!initialTransaction) {
      setAmount('');
      setReceivedAmount('');
      setFeeAmount('');
      setNote('');
      setCounterparty('');
      setDate(todayInputValue());
    }
  };

  return (
    <View style={{ gap: 16 }}>
      <SelectField label={t('transaction.type')} value={type} onChange={setType} options={typeOptions} icon="swap-horizontal-outline" />

      {needsDestination ? (
        <Card style={{ backgroundColor: `${theme.colors.secondary}14`, borderColor: `${theme.colors.secondary}55` }}>
          <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '700' }}>
            {t('transaction.transferHint')}
          </Text>
        </Card>
      ) : null}

      {transactionSupportsCounterparty(type) ? (
        <Card style={{ backgroundColor: `${theme.colors.warning}14`, borderColor: `${theme.colors.warning}55` }}>
          <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '700' }}>{t('transaction.loanHint')}</Text>
        </Card>
      ) : null}

      <Card style={{ gap: 16 }}>
        <AmountInput label={t('common.amount')} value={amount} onChangeText={setAmount} />
        <SelectField
          label={t('common.wallet')}
          value={walletId}
          onChange={setWalletId}
          icon="wallet-outline"
          options={wallets.map((wallet) => ({
            value: wallet.id,
            label: wallet.name,
            icon: wallet.icon,
            color: wallet.color,
          }))}
        />
        <CurrencyPicker label={t('common.currency')} value={currency} onChange={setCurrency} />

        {needsDestination ? (
          <>
            <SelectField
              label={t('transaction.toWallet')}
              value={toWalletId}
              onChange={setToWalletId}
              icon="wallet-outline"
              options={wallets
                .filter((wallet) => wallet.id !== walletId)
                .map((wallet) => ({
                  value: wallet.id,
                  label: wallet.name,
                  icon: wallet.icon,
                  color: wallet.color,
                }))}
            />
            <AmountInput
              label={`${t('transaction.receivedAmount')} (${toWallet?.currency ?? ''})`}
              value={receivedAmount}
              onChangeText={setReceivedAmount}
            />
          </>
        ) : (
          <CategoryPicker
            label={t('common.category')}
            value={categoryId}
            onChange={setCategoryId}
            categories={availableCategories}
            parentValue={parentCategoryId}
            subcategoryValue={subcategoryId}
            onParentChange={setParentCategoryId}
            onSubcategoryChange={setSubcategoryId}
          />
        )}

        {supportsCounterparty ? (
          <TextField label={`${t('transaction.counterparty')} (${t('common.optional')})`} value={counterparty} onChangeText={setCounterparty} />
        ) : null}
      </Card>

      <Card style={{ gap: 16 }}>
        <SelectField
          label={t('transaction.baseCurrency')}
          value={baseCurrency}
          onChange={(value) => {
            setBaseCurrencyState(value);
            setBaseCurrency(value);
          }}
          options={baseCurrencyOptions.map((item) => ({ value: item, label: item, icon: 'cash-outline', badge: getCurrencyBadge(item) }))}
          icon="cash-outline"
          searchable
        />
        <TextField label={t('transaction.exchangeRate')} value={exchangeRate} onChangeText={setExchangeRate} keyboardType="decimal-pad" />
        <TextField label={t('transaction.baseAmount')} value={String(Math.round(baseAmount * 100) / 100)} editable={false} />
      </Card>

      {supportsFees ? (
        <Card style={{ gap: 16 }}>
          <AmountInput label={`${t('transaction.feeAmount')} (${t('common.optional')})`} value={feeAmount} onChangeText={setFeeAmount} />
          <CurrencyPicker label={t('transaction.feeCurrency')} value={feeCurrency} onChange={setFeeCurrency} />
        </Card>
      ) : null}

      <Card style={{ gap: 16 }}>
        <DatePickerField label={t('common.date')} value={date} onChangeText={setDate} />
        <TextField
          label={`${t('common.note')} (${t('common.optional')})`}
          value={note}
          onChangeText={setNote}
          placeholder={t('transaction.notePlaceholder')}
          multiline
        />
      </Card>

      <AppButton title={submitLabel} icon="checkmark-outline" onPress={submit} />
    </View>
  );
}
