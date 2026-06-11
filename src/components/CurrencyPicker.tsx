import { CURRENCIES } from '../constants/currencies';
import type { CurrencyCode } from '../types';
import { SelectField } from './SelectField';

interface CurrencyPickerProps {
  label: string;
  value: CurrencyCode;
  onChange: (currency: CurrencyCode) => void;
}

export function CurrencyPicker({ label, value, onChange }: CurrencyPickerProps) {
  return (
    <SelectField
      label={label}
      value={value}
      onChange={onChange}
      options={CURRENCIES.map((currency) => ({ label: currency, value: currency }))}
    />
  );
}
