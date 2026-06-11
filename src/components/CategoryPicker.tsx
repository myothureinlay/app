import type { Category } from '../types';
import { SelectField } from './SelectField';

interface CategoryPickerProps {
  label: string;
  value: string;
  onChange: (categoryId: string) => void;
  categories: Category[];
}

export function CategoryPicker({ label, value, onChange, categories }: CategoryPickerProps) {
  return (
    <SelectField
      label={label}
      value={value}
      onChange={onChange}
      options={categories.map((category) => ({
        value: category.id,
        label: category.name,
        icon: category.icon,
        color: category.color,
      }))}
    />
  );
}
