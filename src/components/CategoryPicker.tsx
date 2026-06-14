import type { Category } from '../types';
import { SelectField } from './SelectField';
import { useI18n } from '../i18n/useI18n';
import { View } from 'react-native';

interface CategoryPickerProps {
  label: string;
  value: string;
  onChange: (categoryId: string) => void;
  categories: Category[];
  parentValue?: string;
  subcategoryValue?: string;
  onParentChange?: (categoryId: string) => void;
  onSubcategoryChange?: (categoryId: string) => void;
}

export function CategoryPicker({
  label,
  value,
  onChange,
  categories,
  parentValue,
  subcategoryValue,
  onParentChange,
  onSubcategoryChange,
}: CategoryPickerProps) {
  const { t } = useI18n();
  const parents = categories.filter((category) => !category.parentId);
  const selectedParentId = parentValue || categories.find((category) => category.id === value)?.parentId || value;
  const subcategories = categories.filter((category) => category.parentId === selectedParentId);
  const hierarchical = Boolean(onParentChange && onSubcategoryChange);

  if (hierarchical) {
    return (
      <View style={{ gap: 12 }}>
        <SelectField
          label={t('category.parentCategory')}
          value={selectedParentId}
          onChange={(nextParentId) => {
            onParentChange?.(nextParentId);
            onSubcategoryChange?.('');
            onChange(nextParentId);
          }}
          options={parents.map((category) => ({
            value: category.id,
            label: category.name,
            icon: category.icon,
            color: category.color,
          }))}
          icon="pricetags-outline"
          searchable
        />
        {subcategories.length > 0 ? (
          <SelectField
            label={t('category.subcategory')}
            value={subcategoryValue || 'none'}
            onChange={(nextSubcategoryId) => {
              const normalized = nextSubcategoryId === 'none' ? '' : nextSubcategoryId;
              onSubcategoryChange?.(normalized);
              onChange(normalized || selectedParentId);
            }}
            options={[
              { value: 'none', label: t('category.noSubcategory'), icon: 'remove-circle-outline' },
              ...subcategories.map((category) => ({
                value: category.id,
                label: category.name,
                detail: `${parents.find((parent) => parent.id === selectedParentId)?.name ?? label} -> ${category.name}`,
                icon: category.icon,
                color: category.color,
              })),
            ]}
            icon="pricetag-outline"
            searchable
          />
        ) : null}
      </View>
    );
  }

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
      icon="pricetag-outline"
      searchable
    />
  );
}
