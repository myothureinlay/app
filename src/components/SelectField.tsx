import { PickerField, type PickerOption } from './PickerField';

type SelectOption<T extends string> = PickerOption<T>;

interface SelectFieldProps<T extends string> {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  searchable?: boolean;
  title?: string;
  placeholder?: string;
  icon?: string;
}

export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
  searchable,
  title,
  placeholder,
  icon,
}: SelectFieldProps<T>) {
  return (
    <PickerField
      label={label}
      value={value}
      onChange={onChange}
      options={options}
      searchable={searchable}
      title={title}
      placeholder={placeholder}
      icon={icon}
    />
  );
}
