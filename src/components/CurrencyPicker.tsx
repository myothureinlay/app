import { CURRENCIES } from '../constants/currencies';
import { useFinance } from '../context/FinanceContext';
import type { CurrencyCode } from '../types';
import { SelectField } from './SelectField';

interface CurrencyPickerProps {
  label: string;
  value: CurrencyCode;
  onChange: (currency: CurrencyCode) => void;
}

export function CurrencyPicker({ label, value, onChange }: CurrencyPickerProps) {
  const { currencies } = useFinance();
  const codes = currencies.length > 0 ? currencies.filter((currency) => currency.isActive).map((currency) => currency.code) : CURRENCIES;
  const options = codes.includes(value) ? codes : [value, ...codes];

  return (
    <SelectField
      label={label}
      value={value}
      onChange={onChange}
      options={options.map((currency) => ({ label: currency, value: currency }))}
    />
  );
}
