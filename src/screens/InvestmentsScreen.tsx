import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { AmountInput } from '../components/AmountInput';
import { AppButton } from '../components/AppButton';
import { BottomSheet } from '../components/BottomSheet';
import { Card } from '../components/Card';
import { ChartCard, DonutChart, HorizontalBarChart } from '../components/ChartCard';
import { DatePickerField } from '../components/DatePickerField';
import { EmptyState } from '../components/EmptyState';
import { PickerField } from '../components/PickerField';
import { ReportCard } from '../components/ReportCard';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { SectionHeader } from '../components/SectionHeader';
import { TextField } from '../components/TextField';
import { getCurrencyBadge } from '../constants/currencies';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useFinance } from '../context/FinanceContext';
import { useI18n } from '../i18n/useI18n';
import { calculateInvestmentSummary, investmentAllocation } from '../logic/investments';
import type { CurrencyCode, InvestmentAssetType, InvestmentRecord } from '../types';
import { formatDate } from '../utils/dates';
import { formatMoney } from '../utils/money';

const assetTypes: InvestmentAssetType[] = ['stock', 'crypto', 'gold', 'fund', 'bond', 'cash_savings', 'real_estate', 'collectible', 'other'];
const investmentTypes: InvestmentRecord['type'][] = ['buy', 'sell', 'income', 'fee', 'valuation'];

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

function optionalNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && value.trim() !== '' ? parsed : null;
}

export function InvestmentsScreen() {
  const { theme, settings } = useAppPreferences();
  const { investments, wallets, currencies, addInvestment, editInvestment, removeInvestmentById } = useFinance();
  const { t, locale } = useI18n();
  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<InvestmentRecord | null>(null);
  const [type, setType] = useState<InvestmentRecord['type']>('buy');
  const [assetType, setAssetType] = useState<InvestmentAssetType>('crypto');
  const [assetName, setAssetName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>(settings.baseCurrency);
  const [walletId, setWalletId] = useState('none');
  const [currentValue, setCurrentValue] = useState('');
  const [realizedProfitLoss, setRealizedProfitLoss] = useState('');
  const [unrealizedProfitLoss, setUnrealizedProfitLoss] = useState('');
  const [date, setDate] = useState(todayValue());
  const [note, setNote] = useState('');
  const activeInvestments = investments.filter((investment) => !investment.deletedAt);
  const summary = calculateInvestmentSummary(activeInvestments, settings.baseCurrency);
  const allocation = investmentAllocation(activeInvestments, settings.baseCurrency);
  const currencyOptions = currencies.length > 0 ? currencies.filter((item) => item.isActive).map((item) => item.code) : [settings.baseCurrency];

  const reset = () => {
    setEditing(null);
    setType('buy');
    setAssetType('crypto');
    setAssetName('');
    setQuantity('');
    setUnitPrice('');
    setAmount('');
    setCurrency(settings.baseCurrency);
    setWalletId('none');
    setCurrentValue('');
    setRealizedProfitLoss('');
    setUnrealizedProfitLoss('');
    setDate(todayValue());
    setNote('');
  };

  const openAdd = () => {
    reset();
    setFormVisible(true);
  };

  const openEdit = (record: InvestmentRecord) => {
    setEditing(record);
    setType(record.type);
    setAssetType(record.assetType);
    setAssetName(record.assetName);
    setQuantity(record.quantity == null ? '' : String(record.quantity));
    setUnitPrice(record.unitPrice == null ? '' : String(record.unitPrice));
    setAmount(String(record.amount));
    setCurrency(record.currency);
    setWalletId(record.walletId ?? 'none');
    setCurrentValue(record.currentValue == null ? '' : String(record.currentValue));
    setRealizedProfitLoss(record.realizedProfitLoss == null ? '' : String(record.realizedProfitLoss));
    setUnrealizedProfitLoss(record.unrealizedProfitLoss == null ? '' : String(record.unrealizedProfitLoss));
    setDate(record.date.slice(0, 10));
    setNote(record.note ?? '');
    setFormVisible(true);
  };

  const closeForm = () => {
    setFormVisible(false);
    reset();
  };

  const submit = async () => {
    const amountValue = Number(amount);
    if (!assetName.trim() || !Number.isFinite(amountValue) || amountValue <= 0) {
      Alert.alert(t('investments.invalidForm'));
      return;
    }

    const input = {
      type,
      assetType,
      assetName: assetName.trim(),
      quantity: optionalNumber(quantity),
      unitPrice: optionalNumber(unitPrice),
      amount: amountValue,
      currency,
      walletId: walletId === 'none' ? null : walletId,
      transactionId: null,
      currentValue: optionalNumber(currentValue),
      realizedProfitLoss: optionalNumber(realizedProfitLoss),
      unrealizedProfitLoss: optionalNumber(unrealizedProfitLoss),
      date: `${date}T12:00:00.000Z`,
      note: note.trim() || null,
    };

    if (editing) {
      await editInvestment({
        ...editing,
        ...input,
      });
    } else {
      await addInvestment(input);
    }
    closeForm();
  };

  const removeRecord = (record: InvestmentRecord) => {
    Alert.alert(t('investments.deleteTitle'), t('investments.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.remove'), style: 'destructive', onPress: () => removeInvestmentById(record.id) },
    ]);
  };

  return (
    <Screen>
      <ScreenHeader
        title={t('nav.investments')}
        subtitle={t('investments.subtitle')}
        action={<AppButton title="" icon="add-outline" shape="circle" onPress={openAdd} />}
      />

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <ReportCard label={t('investments.totalInvested')} value={summary.totalInvested} currency={settings.baseCurrency} icon="trending-up-outline" color={theme.colors.primary} />
        <ReportCard label={t('investments.currentValue')} value={summary.currentValue} currency={settings.baseCurrency} icon="analytics-outline" color={theme.colors.success} />
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <ReportCard label={t('investments.realizedProfitLoss')} value={summary.realizedProfitLoss} currency={settings.baseCurrency} icon="cash-outline" color={summary.realizedProfitLoss >= 0 ? theme.colors.success : theme.colors.danger} />
        <ReportCard label={t('investments.unrealizedProfitLoss')} value={summary.unrealizedProfitLoss} currency={settings.baseCurrency} icon="pulse-outline" color={summary.unrealizedProfitLoss >= 0 ? theme.colors.success : theme.colors.danger} />
      </View>

      <ChartCard title={t('investments.assetAllocation')}>
        {allocation.length === 0 ? (
          <Text style={{ color: theme.colors.textMuted }}>{t('reports.noData')}</Text>
        ) : (
          <>
            <DonutChart data={allocation.map((row) => ({ ...row, value: row.total, label: t(`investmentAssetTypes.${row.key}`) }))} />
            <HorizontalBarChart data={allocation.map((row) => ({ ...row, value: row.total, label: t(`investmentAssetTypes.${row.key}`) }))} currency={settings.baseCurrency} />
          </>
        )}
      </ChartCard>

      <SectionHeader title={t('investments.records')} />
      {activeInvestments.length === 0 ? (
        <EmptyState
          title={t('investments.noInvestments')}
          body={t('investments.noInvestmentsBody')}
          icon="trending-up-outline"
          actionLabel={t('investments.addInvestment')}
          actionIcon="add-circle-outline"
          onAction={openAdd}
        />
      ) : (
        <View style={{ gap: 10 }}>
          {activeInvestments.map((record) => (
            <Pressable key={record.id} accessibilityRole="button" onPress={() => openEdit(record)}>
              <Card style={{ gap: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: theme.radius.md,
                      backgroundColor: `${theme.colors.primary}18`,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="trending-up-outline" size={20} color={theme.colors.primary} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ color: theme.colors.text, fontSize: 15, fontWeight: '900' }} numberOfLines={1}>
                      {record.assetName}
                    </Text>
                    <Text style={{ color: theme.colors.textMuted, fontSize: 12 }} numberOfLines={1}>
                      {t(`investmentTypes.${record.type}`)} · {t(`investmentAssetTypes.${record.assetType}`)} · {formatDate(record.date, locale)}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 2 }}>
                    <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '900' }}>{formatMoney(record.amount, record.currency)}</Text>
                    {record.currentValue != null ? (
                      <Text style={{ color: theme.colors.textMuted, fontSize: 11 }}>{formatMoney(record.currentValue, record.currency)}</Text>
                    ) : null}
                  </View>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
                  <AppButton title="" icon="create-outline" variant="ghost" onPress={() => openEdit(record)} style={{ width: 40, minHeight: 34 }} />
                  <AppButton title="" icon="trash-outline" variant="ghost" onPress={() => removeRecord(record)} style={{ width: 40, minHeight: 34 }} />
                </View>
              </Card>
            </Pressable>
          ))}
        </View>
      )}

      <BottomSheet visible={formVisible} title={editing ? t('investments.editInvestment') : t('investments.addInvestment')} onClose={closeForm}>
        <PickerField
          label={t('investments.recordType')}
          value={type}
          onChange={setType}
          options={investmentTypes.map((item) => ({ label: t(`investmentTypes.${item}`), value: item, icon: item === 'sell' ? 'trending-down-outline' : 'trending-up-outline' }))}
          icon="repeat-outline"
        />
        <PickerField
          label={t('investments.assetType')}
          value={assetType}
          onChange={setAssetType}
          options={assetTypes.map((item) => ({ label: t(`investmentAssetTypes.${item}`), value: item, icon: 'diamond-outline' }))}
          icon="diamond-outline"
          searchable
        />
        <TextField label={t('investments.assetName')} value={assetName} onChangeText={setAssetName} placeholder="BTC, Gold, AAPL" />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <AmountInput label={t('investments.quantity')} value={quantity} onChangeText={setQuantity} />
          </View>
          <View style={{ flex: 1 }}>
            <AmountInput label={t('investments.unitPrice')} value={unitPrice} onChangeText={setUnitPrice} />
          </View>
        </View>
        <AmountInput label={t('common.amount')} value={amount} onChangeText={setAmount} />
        <PickerField
          label={t('common.currency')}
          value={currency}
          onChange={setCurrency}
          options={(currencyOptions.includes(currency) ? currencyOptions : [currency, ...currencyOptions]).map((item) => ({ label: item, value: item, icon: 'cash-outline', badge: getCurrencyBadge(item) }))}
          icon="cash-outline"
          searchable
        />
        <PickerField
          label={t('common.wallet')}
          value={walletId}
          onChange={setWalletId}
          options={[
            { label: t('investments.noLinkedWallet'), value: 'none', icon: 'remove-circle-outline' },
            ...wallets.map((wallet) => ({ label: wallet.name, value: wallet.id, icon: wallet.icon, color: wallet.color })),
          ]}
          icon="wallet-outline"
          searchable
        />
        <AmountInput label={t('investments.currentValue')} value={currentValue} onChangeText={setCurrentValue} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <AmountInput label={t('investments.realizedProfitLoss')} value={realizedProfitLoss} onChangeText={setRealizedProfitLoss} />
          </View>
          <View style={{ flex: 1 }}>
            <AmountInput label={t('investments.unrealizedProfitLoss')} value={unrealizedProfitLoss} onChangeText={setUnrealizedProfitLoss} />
          </View>
        </View>
        <DatePickerField label={t('common.date')} value={date} onChangeText={setDate} />
        <TextField label={t('transaction.note')} value={note} onChangeText={setNote} multiline />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <AppButton title={t('common.save')} icon="checkmark-outline" onPress={submit} style={{ flex: 1 }} />
          <AppButton title={t('common.cancel')} variant="secondary" onPress={closeForm} style={{ flex: 1 }} />
        </View>
      </BottomSheet>
    </Screen>
  );
}
