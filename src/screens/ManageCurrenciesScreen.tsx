import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { PickerField } from '../components/PickerField';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { TextField } from '../components/TextField';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useFinance } from '../context/FinanceContext';
import { useI18n } from '../i18n/useI18n';
import type { CurrencyDefinition, CurrencyKind } from '../types';
import { parseNumber } from '../utils/money';

export function ManageCurrenciesScreen() {
  const { theme, settings, setBaseCurrency } = useAppPreferences();
  const { currencies, addCurrency, editCurrency, removeCurrencyByCode } = useFinance();
  const { t } = useI18n();
  const [editing, setEditing] = useState<CurrencyDefinition | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [decimalPlaces, setDecimalPlaces] = useState('2');
  const [type, setType] = useState<CurrencyKind>('custom');
  const [favorite, setFavorite] = useState('false');
  const [confirmRemove, setConfirmRemove] = useState<CurrencyDefinition | null>(null);

  const startEdit = (currency: CurrencyDefinition) => {
    setEditing(currency);
    setCode(currency.code);
    setName(currency.name);
    setSymbol(currency.symbol);
    setDecimalPlaces(String(currency.decimalPlaces));
    setType(currency.type);
    setFavorite(currency.isFavorite ? 'true' : 'false');
  };

  const reset = () => {
    setEditing(null);
    setCode('');
    setName('');
    setSymbol('');
    setDecimalPlaces('2');
    setType('custom');
    setFavorite('false');
  };

  const submit = async () => {
    if (!code.trim() || !name.trim()) {
      Alert.alert(t('currency.required'));
      return;
    }

    const input = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      symbol: symbol.trim() || code.trim().toUpperCase(),
      decimalPlaces: Math.max(0, Math.min(8, Math.round(parseNumber(decimalPlaces)))),
      type,
      isFavorite: favorite === 'true',
    };

    if (editing) {
      await editCurrency({ ...input, isActive: editing.isActive });
    } else {
      await addCurrency(input);
    }
    reset();
  };

  return (
    <Screen>
      <ScreenHeader title={t('currency.title')} subtitle={t('currency.subtitle')} />
      <Card style={{ gap: 14 }}>
        <TextField label={t('currency.code')} value={code} onChangeText={setCode} editable={!editing} />
        <TextField label={t('currency.name')} value={name} onChangeText={setName} />
        <TextField label={t('currency.symbol')} value={symbol} onChangeText={setSymbol} />
        <TextField label={t('currency.decimals')} value={decimalPlaces} onChangeText={setDecimalPlaces} keyboardType="number-pad" />
        <PickerField
          label={t('common.type')}
          value={type}
          onChange={setType}
          options={[
            { label: t('currency.fiat'), value: 'fiat' },
            { label: t('currency.crypto'), value: 'crypto' },
            { label: t('currency.custom'), value: 'custom' },
          ]}
        />
        <PickerField
          label={t('currency.favorite')}
          value={favorite}
          onChange={setFavorite}
          options={[
            { label: t('currency.normal'), value: 'false' },
            { label: t('currency.favorite'), value: 'true' },
          ]}
        />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <AppButton title={t('common.save')} icon="checkmark-outline" onPress={submit} style={{ flex: 1 }} />
          {editing ? <AppButton title={t('common.cancel')} variant="secondary" onPress={reset} style={{ flex: 1 }} /> : null}
        </View>
      </Card>

      <Card style={{ gap: 10 }}>
        <PickerField
          label={t('settings.baseCurrency')}
          value={settings.baseCurrency}
          onChange={setBaseCurrency}
          options={currencies.filter((currency) => currency.isActive).map((currency) => ({ label: currency.code, value: currency.code }))}
          searchable
        />
      </Card>

      <View style={{ gap: 10 }}>
        {currencies.map((currency) => (
          <Card key={currency.code} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '900' }}>
                {currency.code} · {currency.symbol}
              </Text>
              <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>
                {currency.name} · {currency.type} · {currency.isActive ? t('common.active') : t('common.removed')}
              </Text>
            </View>
            <AppButton title="" icon="create-outline" variant="ghost" onPress={() => startEdit(currency)} />
            <AppButton title="" icon="trash-outline" variant="ghost" onPress={() => setConfirmRemove(currency)} />
          </Card>
        ))}
      </View>

      <ConfirmDialog
        visible={Boolean(confirmRemove)}
        title={t('currency.removeTitle')}
        body={t('currency.removeBody')}
        confirmLabel={t('common.remove')}
        cancelLabel={t('common.cancel')}
        destructive
        onCancel={() => setConfirmRemove(null)}
        onConfirm={async () => {
          if (confirmRemove) await removeCurrencyByCode(confirmRemove.code);
          setConfirmRemove(null);
        }}
      />
    </Screen>
  );
}
