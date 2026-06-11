import { TextField } from './TextField';

interface AmountInputProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
}

export function AmountInput({ label, value, onChangeText, placeholder = '0.00' }: AmountInputProps) {
  return (
    <TextField
      label={label}
      value={value}
      onChangeText={onChangeText}
      keyboardType="decimal-pad"
      placeholder={placeholder}
    />
  );
}
