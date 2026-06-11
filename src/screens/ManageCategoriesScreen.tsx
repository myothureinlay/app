import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { ChipGroup } from '../components/ChipGroup';
import { EmptyState } from '../components/EmptyState';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { SelectField } from '../components/SelectField';
import { TextField } from '../components/TextField';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useFinance } from '../context/FinanceContext';
import { useI18n } from '../i18n/useI18n';
import { categoryTypes } from '../logic/ledger';
import type { Category, CategoryType } from '../types';

const categoryColors = ['#16A34A', '#EF4444', '#F97316', '#8B5CF6', '#0EA5E9', '#EC4899', '#F59E0B', '#64748B'];
const categoryIcons = [
  'briefcase-outline',
  'restaurant-outline',
  'car-outline',
  'home-outline',
  'card-outline',
  'cash-outline',
  'receipt-outline',
  'swap-horizontal-outline',
  'arrow-up-circle-outline',
  'arrow-down-circle-outline',
  'document-text-outline',
  'alert-circle-outline',
  'sparkles-outline',
  'heart-outline',
  'school-outline',
  'airplane-outline',
];

const iconByType: Record<CategoryType, string> = {
  income: 'trending-up-outline',
  expense: 'trending-down-outline',
  loan: 'arrow-up-circle-outline',
  debt: 'arrow-down-circle-outline',
  transfer: 'swap-horizontal-outline',
  adjustment: 'options-outline',
  other: 'ellipse-outline',
};

export function ManageCategoriesScreen() {
  const { theme } = useAppPreferences();
  const { categories, addCategory, editCategory, archiveCategoryById } = useFinance();
  const { t } = useI18n();
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>('expense');
  const [color, setColor] = useState(categoryColors[1]);
  const [icon, setIcon] = useState(iconByType.expense);

  useEffect(() => {
    if (!editing) return;
    setName(editing.name);
    setType(editing.type);
    setColor(editing.color);
    setIcon(editing.icon);
  }, [editing]);

  const reset = () => {
    setEditing(null);
    setName('');
    setType('expense');
    setColor(categoryColors[1]);
    setIcon(iconByType.expense);
  };

  const submit = async () => {
    if (!name.trim()) {
      Alert.alert(t('manage.categoryName'));
      return;
    }

    if (editing) {
      await editCategory({
        id: editing.id,
        name: name.trim(),
        type,
        color,
        icon,
      });
    } else {
      await addCategory({
        name: name.trim(),
        type,
        color,
        icon,
      });
    }
    Alert.alert(t('manage.categorySaved'));
    reset();
  };

  return (
    <Screen>
      <ScreenHeader title={t('nav.categories')} subtitle={t('manage.defaultsSeeded')} />

      <Card style={{ gap: 16 }}>
        <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '900' }}>
          {editing ? t('manage.editCategory') : t('manage.addCategory')}
        </Text>
        <TextField label={t('manage.categoryName')} value={name} onChangeText={setName} />
        <SelectField
          label={t('common.type')}
          value={type}
          onChange={(value) => {
            setType(value);
            setIcon(iconByType[value]);
          }}
          options={categoryTypes.map((item) => ({ label: t(`categoryTypes.${item}`), value: item }))}
        />
        <Text style={{ color: theme.colors.textMuted, fontSize: 13, fontWeight: '700' }}>{t('common.icon')}</Text>
        <ChipGroup
          value={icon}
          onChange={setIcon}
          options={categoryIcons.map((item) => ({ label: ' ', value: item, icon: item, color }))}
        />
        <Text style={{ color: theme.colors.textMuted, fontSize: 13, fontWeight: '700' }}>{t('common.color')}</Text>
        <ChipGroup
          value={color}
          onChange={setColor}
          options={categoryColors.map((item) => ({ label: ' ', value: item, color: item }))}
        />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <AppButton title={t('common.save')} icon="checkmark-outline" onPress={submit} style={{ flex: 1 }} />
          {editing ? <AppButton title={t('common.cancel')} variant="secondary" onPress={reset} style={{ flex: 1 }} /> : null}
        </View>
      </Card>

      <View style={{ gap: 10 }}>
        {categories.length === 0 ? (
          <EmptyState title={t('empty.title')} body={t('empty.categories')} />
        ) : (
          categories.map((category) => (
            <Pressable key={category.id} onPress={() => setEditing(category)}>
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: theme.radius.md,
                    backgroundColor: `${category.color}22`,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name={category.icon as never} size={20} color={category.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.colors.text, fontSize: 15, fontWeight: '900' }}>{category.name}</Text>
                  <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>{t(`categoryTypes.${category.type}`)}</Text>
                </View>
                <AppButton
                  title=""
                  icon="archive-outline"
                  variant="ghost"
                  onPress={async () => {
                    await archiveCategoryById(category.id);
                    Alert.alert(t('manage.categoryArchived'));
                  }}
                />
              </Card>
            </Pressable>
          ))
        )}
      </View>
    </Screen>
  );
}
