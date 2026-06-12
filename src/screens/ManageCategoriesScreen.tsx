import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { BottomSheet } from '../components/BottomSheet';
import { Card } from '../components/Card';
import { ChipGroup } from '../components/ChipGroup';
import { ConfirmDialog } from '../components/ConfirmDialog';
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
  'basket-outline',
  'cart-outline',
  'medical-outline',
  'fitness-outline',
  'bus-outline',
  'train-outline',
  'bicycle-outline',
  'speedometer-outline',
  'wifi-outline',
  'phone-portrait-outline',
  'flash-outline',
  'water-outline',
  'game-controller-outline',
  'film-outline',
  'gift-outline',
  'people-outline',
  'person-add-outline',
  'business-outline',
  'storefront-outline',
  'construct-outline',
  'hammer-outline',
  'shield-checkmark-outline',
  'medal-outline',
  'trophy-outline',
  'diamond-outline',
  'wallet-outline',
  'calculator-outline',
  'library-outline',
  'globe-outline',
  'earth-outline',
  'trending-up-outline',
  'trending-down-outline',
  'bar-chart-outline',
  'pie-chart-outline',
  'stats-chart-outline',
  'calendar-outline',
  'time-outline',
  'cloud-outline',
  'leaf-outline',
  'flower-outline',
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
  const { categories, addCategory, editCategory, removeCategoryById } = useFinance();
  const { t } = useI18n();
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>('expense');
  const [color, setColor] = useState(categoryColors[1]);
  const [icon, setIcon] = useState(iconByType.expense);
  const [iconSearch, setIconSearch] = useState('');
  const [removeTarget, setRemoveTarget] = useState<Category | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const filteredIcons = categoryIcons.filter((item) => item.includes(iconSearch.trim().toLowerCase()));

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
    setIconSearch('');
  };

  const closeForm = () => {
    setFormVisible(false);
    reset();
  };

  const openAdd = () => {
    reset();
    setFormVisible(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setName(category.name);
    setType(category.type);
    setColor(category.color);
    setIcon(category.icon);
    setFormVisible(true);
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
    closeForm();
  };

  return (
    <Screen>
      <ScreenHeader
        title={t('nav.categories')}
        subtitle={t('manage.defaultsSeeded')}
        action={<AppButton title="" icon="add-outline" onPress={openAdd} style={{ width: 44, paddingHorizontal: 0 }} />}
      />

      <View style={{ gap: 10 }}>
        {categories.length === 0 ? (
          <EmptyState
            title={t('empty.title')}
            body={t('empty.categories')}
            icon="pricetags-outline"
            actionLabel={t('manage.addCategory')}
            actionIcon="add-circle-outline"
            onAction={openAdd}
          />
        ) : (
          categories.map((category) => (
            <Pressable key={category.id} onPress={() => openEdit(category)}>
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
                  icon="trash-outline"
                  variant="ghost"
                  onPress={() => setRemoveTarget(category)}
                />
              </Card>
            </Pressable>
          ))
        )}
      </View>
      <BottomSheet
        visible={formVisible}
        title={editing ? t('manage.editCategory') : t('manage.addCategory')}
        onClose={closeForm}
      >
        <TextField label={t('manage.categoryName')} value={name} onChangeText={setName} />
        <SelectField
          label={t('common.type')}
          value={type}
          onChange={(value) => {
            setType(value);
            setIcon(iconByType[value]);
          }}
          options={categoryTypes.map((item) => ({ label: t(`categoryTypes.${item}`), value: item, icon: iconByType[item] }))}
          icon="pricetag-outline"
        />
        <TextField label={t('manage.searchIcons')} value={iconSearch} onChangeText={setIconSearch} />
        <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '800' }}>{t('common.icon')}</Text>
        <ChipGroup
          value={icon}
          onChange={setIcon}
          options={(filteredIcons.length > 0 ? filteredIcons : categoryIcons).slice(0, 24).map((item) => ({ label: ' ', value: item, icon: item, color }))}
        />
        <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '800' }}>{t('common.color')}</Text>
        <ChipGroup
          value={color}
          onChange={setColor}
          options={categoryColors.map((item) => ({ label: ' ', value: item, color: item }))}
        />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <AppButton title={t('common.save')} icon="checkmark-outline" onPress={submit} style={{ flex: 1 }} />
          <AppButton title={t('common.cancel')} variant="secondary" onPress={closeForm} style={{ flex: 1 }} />
        </View>
      </BottomSheet>
      <ConfirmDialog
        visible={Boolean(removeTarget)}
        title={t('manage.removeCategory')}
        body={t('manage.removeCategoryBody')}
        confirmLabel={t('common.remove')}
        cancelLabel={t('common.cancel')}
        destructive
        onCancel={() => setRemoveTarget(null)}
        onConfirm={async () => {
          if (removeTarget) {
            const decision = await removeCategoryById(removeTarget.id);
            Alert.alert(t('common.remove'), decision.warning ?? t('manage.categoryRemoved'));
          }
          setRemoveTarget(null);
        }}
      />
    </Screen>
  );
}
