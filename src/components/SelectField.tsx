import { Text, View } from 'react-native';

import { useAppPreferences } from '../context/AppPreferencesContext';
import { ChipGroup } from './ChipGroup';

interface SelectOption<T extends string> {
  label: string;
  value: T;
  icon?: string;
  color?: string;
}

interface SelectFieldProps<T extends string> {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
}

export function SelectField<T extends string>({ label, value, onChange, options }: SelectFieldProps<T>) {
  const { theme } = useAppPreferences();

  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: theme.colors.textMuted, fontSize: 13, fontWeight: '700' }}>{label}</Text>
      <ChipGroup value={value} onChange={onChange} options={options} />
    </View>
  );
}
