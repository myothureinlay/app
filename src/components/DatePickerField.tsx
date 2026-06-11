import { TextField } from './TextField';

interface DatePickerFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
}

export function DatePickerField({ label, value, onChangeText }: DatePickerFieldProps) {
  return <TextField label={label} value={value} onChangeText={onChangeText} placeholder="YYYY-MM-DD" />;
}
